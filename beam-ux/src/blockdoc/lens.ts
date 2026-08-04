/**
 * BlockDoc lens core — lossless `.tsx` ⟷ BlockDoc.
 *
 * `parse` builds the lens over a recast AST; `print` serializes the (possibly patched)
 * AST back. Untouched nodes reprint from their original tokens, so an unedited
 * parse→print is byte-identical, and any single edit is surgical (only the target node's
 * tokens change) and idempotent.
 */

import * as recast from 'recast';
import * as babelTsParser from 'recast/parsers/babel-ts.js';
import * as t from '@babel/types';
import type { File } from '@babel/types';
import type {
    BlockChild,
    BlockDoc,
    BlockNode,
    BlockProp,
    PropKind,
    TextNode,
} from './types.js';

/** The recast parser config — a single instance so parse + reprint agree on tokens. */
const parser = babelTsParser;

/** Parse a `.tsx` source string into an editable BlockDoc lens. */
export function parse(tsx: string): BlockDoc {
    const ast = recast.parse(tsx, { parser }) as File;
    const roots: BlockNode[] = [];
    const seen = new Set<t.Node>();

    // Walk the whole program collecting *top-level* JSX (a JSX node whose nearest JSX
    // ancestor is not itself in the tree). recast's AST is estree-ish but node shapes
    // match @babel/types, so we hand-walk to avoid pulling @babel/traverse at runtime.
    walk(ast.program, (node) => {
        if ((t.isJSXElement(node) || t.isJSXFragment(node)) && !seen.has(node)) {
            const block = buildBlock(node, seen);
            if (block) roots.push(block);
        }
    });

    return { ast, roots };
}

/** Serialize a BlockDoc (or a raw AST) back to a `.tsx` string. */
export function print(input: BlockDoc | File): string {
    const ast = 'ast' in (input as BlockDoc) ? (input as BlockDoc).ast : (input as File);
    return recast.print(ast).code;
}

// ---------------------------------------------------------------------------
// Lens construction
// ---------------------------------------------------------------------------

function buildBlock(
    el: t.JSXElement | t.JSXFragment,
    seen: Set<t.Node>,
): BlockNode {
    seen.add(el);
    const isElement = t.isJSXElement(el);
    const opening = isElement ? el.openingElement : null;

    const name = opening ? jsxName(opening.name) : null;
    const isComponent = !!name && /^[A-Z]/.test(name.replace(/^.*\./, name[0]));

    const props: BlockProp[] = [];
    let dynamic = !isElement ? false : opening!.attributes.some((a) => t.isJSXSpreadAttribute(a));
    if (opening) {
        for (const attr of opening.attributes) {
            if (t.isJSXAttribute(attr)) {
                props.push(buildProp(attr));
            }
            // JSXSpreadAttribute already flagged dynamic above; it carries no static prop.
        }
    }

    const children: BlockChild[] = [];
    for (const child of el.children) {
        if (t.isJSXText(child)) {
            // Whitespace-only JSXText between elements is layout, not addressable content;
            // keep it out of the lens but it stays in the AST and reprints verbatim.
            if (child.value.trim() === '') continue;
            children.push(textFromJSXText(child));
        } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
            children.push(buildBlock(child, seen));
        } else if (t.isJSXExpressionContainer(child)) {
            const expr = child.expression;
            if (t.isJSXEmptyExpression(expr)) {
                // A `{/* comment */}` container: comments hang off the empty expression.
                continue;
            }
            if (t.isStringLiteral(expr) || t.isTemplateLiteral(expr)) {
                children.push(textFromExpression(child, expr));
            } else {
                // Any other expression child (`{items.map(...)}`, `{cond && <X/>}`, a bare
                // identifier, a call) is dynamic — an opaque island for ticket 11.
                dynamic = true;
            }
        } else if (t.isJSXSpreadChild(child)) {
            dynamic = true;
        }
    }

    return {
        type: 'block',
        name,
        isComponent,
        props,
        children,
        dynamic,
        node: el,
    };
}

function buildProp(attr: t.JSXAttribute): BlockProp {
    const name = jsxName(attr.name);
    const value = attr.value;

    // Bare attribute (`<X disabled />`) ⇒ boolean shorthand, value true.
    if (value == null) {
        return { name, kind: 'boolean-shorthand', value: true, node: attr };
    }

    // `attr="literal"` ⇒ string literal.
    if (t.isStringLiteral(value)) {
        return { name, kind: 'string', value: value.value, node: attr };
    }

    if (t.isJSXExpressionContainer(value)) {
        const expr = value.expression;
        if (t.isStringLiteral(expr)) {
            return { name, kind: 'string', value: expr.value, node: attr };
        }
        if (t.isNumericLiteral(expr)) {
            return { name, kind: 'number', value: expr.value, node: attr };
        }
        if (t.isBooleanLiteral(expr)) {
            return { name, kind: 'boolean', value: expr.value, node: attr };
        }
        if (
            t.isUnaryExpression(expr) &&
            expr.operator === '-' &&
            t.isNumericLiteral(expr.argument)
        ) {
            return { name, kind: 'number', value: -expr.argument.value, node: attr };
        }
        // Everything else (`style={{…}}`, `onClick={fn}`, `n={a + b}`, template literals):
        // an opaque expression. Surface its source text for display only.
        return {
            name,
            kind: 'expression',
            value: exprSource(expr),
            node: attr,
        };
    }

    // A JSXElement/JSXFragment value (`prop=<X/>`) is rare; treat as expression.
    return { name, kind: 'expression', value: exprSource(value as t.Node), node: attr };
}

function textFromJSXText(node: t.JSXText): TextNode {
    return { type: 'text', value: node.value, node };
}

function textFromExpression(
    _container: t.JSXExpressionContainer,
    expr: t.StringLiteral | t.TemplateLiteral,
): TextNode {
    const value = t.isStringLiteral(expr)
        ? expr.value
        : expr.quasis.map((q) => q.value.cooked ?? q.value.raw).join('');
    // Back the text node with the literal itself so a patch targets its tokens.
    return { type: 'text', value, node: expr };
}

// ---------------------------------------------------------------------------
// Edit ops — surgical AST patches. Re-`print` the doc to serialize.
// ---------------------------------------------------------------------------

/**
 * Patch a prop's value on the AST node this `BlockProp` references. The new value's kind
 * is inferred from its JS type (string ⇒ string literal attr, number ⇒ `{n}`, boolean ⇒
 * `{true}`/`{false}`). Only this attribute's tokens change on reprint.
 */
export function patchProp(prop: BlockProp, value: string | number | boolean): void {
    const attr = prop.node as t.JSXAttribute;
    const [attrValue, kind] = encodeScalar(value);
    attr.value = attrValue;
    prop.kind = kind;
    prop.value = value;
}

/**
 * Build a `JSXAttribute`'s `value` node + the `PropKind` it projects, from a JS scalar. The single
 * encoding both `patchProp` (edit in place) and `addProp` (create absent attr) share, so a `className`
 * you *set* and one you *edit* are byte-identical. A string ⇒ a `"literal"` attr; number/boolean ⇒
 * `{n}` / `{true}` expression containers. `null` value ⇒ a bare boolean-shorthand attr (`<X flag />`).
 */
function encodeScalar(
    value: string | number | boolean,
): [t.StringLiteral | t.JSXExpressionContainer, PropKind] {
    if (typeof value === 'string') return [t.stringLiteral(value), 'string'];
    if (typeof value === 'number')
        return [t.jsxExpressionContainer(t.numericLiteral(value)), 'number'];
    return [t.jsxExpressionContainer(t.booleanLiteral(value)), 'boolean'];
}

/**
 * ADD a NEW attribute to a block that doesn't have one yet — the op ticket 09's prop panels need to set
 * a `className` / `data-*` / `aria-*` / `style` / any prop that was ABSENT (the lens only patched
 * in-place before). Appends a `JSXAttribute` to the opening element, pushes a fresh `BlockProp` onto
 * the block's `props`, and RETURNS it so the caller can keep editing it. If the attr already exists,
 * this delegates to `patchProp`/`patchPropExpression` (idempotent — no duplicate attribute).
 *
 * `value` is a JS scalar (string/number/boolean) encoded like `patchProp`; pass `{ expression: src }`
 * to add a raw `{…}` expression prop (`style={{color:'red'}}`). Only the new attribute's tokens appear
 * on reprint; every sibling attr + the children reprint verbatim.
 */
export function addProp(
    block: BlockNode,
    name: string,
    value: string | number | boolean | { expression: string },
): BlockProp {
    const existing = block.props.find((p) => p.name === name);
    if (existing) {
        if (typeof value === 'object') patchPropExpression(existing, value.expression);
        else patchProp(existing, value);
        return existing;
    }

    const el = block.node as t.JSXElement | t.JSXFragment;
    if (!t.isJSXElement(el)) {
        throw new Error('addProp: cannot add an attribute to a fragment');
    }

    let attrValue: t.JSXAttribute['value'];
    let kind: PropKind;
    let propValue: string | number | boolean;
    if (typeof value === 'object') {
        attrValue = t.jsxExpressionContainer(parseExpression(value.expression) as t.Expression);
        kind = 'expression';
        propValue = value.expression;
    } else {
        [attrValue, kind] = encodeScalar(value);
        propValue = value;
    }

    const attr = t.jsxAttribute(t.jsxIdentifier(name), attrValue);
    el.openingElement.attributes.push(attr);

    const prop: BlockProp = { name, kind, value: propValue, node: attr };
    block.props.push(prop);
    return prop;
}

/**
 * REMOVE an attribute from a block — the inverse of `addProp` (a prop panel clearing a `className` /
 * `data-*` / `style` back to absent, not to `""`). Splices the `JSXAttribute` out of the opening
 * element and drops the `BlockProp` from the block's `props`. Returns `true` when an attr was removed,
 * `false` when the name wasn't present (idempotent — removing an absent attr is a no-op). Every
 * surviving attr + the children reprint verbatim.
 */
export function removeProp(block: BlockNode, name: string): boolean {
    const idx = block.props.findIndex((p) => p.name === name);
    if (idx === -1) return false;

    const prop = block.props[idx];
    const el = block.node as t.JSXElement | t.JSXFragment;
    if (t.isJSXElement(el)) {
        const attrs = el.openingElement.attributes;
        const attrIdx = attrs.indexOf(prop.node as t.JSXAttribute);
        if (attrIdx !== -1) attrs.splice(attrIdx, 1);
    }
    block.props.splice(idx, 1);
    return true;
}

/**
 * Replace a prop's value with a raw JS *expression* (`style={{…}}`, `n={a + b}`). The
 * expression source is parsed and its AST substituted. Use this from a prop panel's
 * "edit as code" affordance; use `patchProp` for literal edits.
 */
export function patchPropExpression(prop: BlockProp, exprSrc: string): void {
    const attr = prop.node as t.JSXAttribute;
    const expr = parseExpression(exprSrc);
    attr.value = t.jsxExpressionContainer(expr as t.Expression);
    prop.kind = 'expression';
    prop.value = exprSrc;
}

/**
 * Patch a text node's content. For a `JSXText` node the raw value is replaced; for a
 * string/template literal (a `{"..."}` child) the literal's value is replaced. Only this
 * text node's tokens change on reprint.
 */
export function patchText(text: TextNode, value: string): void {
    const node = text.node as t.Node;
    if (t.isJSXText(node)) {
        node.value = value;
        // recast reprints from `value`; clear the cached raw extra so it re-emits.
        (node as { extra?: unknown }).extra = undefined;
    } else if (t.isStringLiteral(node)) {
        node.value = value;
        (node as { extra?: unknown }).extra = undefined;
    } else if (t.isTemplateLiteral(node)) {
        // Collapse the template to a single cooked/raw quasi so the new text round-trips.
        node.expressions = [];
        node.quasis = [t.templateElement({ raw: value, cooked: value }, true)];
    }
    text.value = value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsxName(
    name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
): string {
    if (t.isJSXIdentifier(name)) return name.name;
    if (t.isJSXNamespacedName(name)) return `${name.namespace.name}:${name.name.name}`;
    // JSXMemberExpression, e.g. `Foo.Bar`
    return `${jsxName(name.object)}.${name.property.name}`;
}

/** Best-effort source text of an expression, for display in the lens. */
function exprSource(node: t.Node): string {
    try {
        return recast.print(node).code;
    } catch {
        return '';
    }
}

/** Parse a standalone expression string into an AST expression node. */
function parseExpression(src: string): t.Node {
    // Wrap so recast/babel-ts parses it as an expression, then unwrap.
    const file = recast.parse(`(${src})`, { parser }) as File;
    const stmt = file.program.body[0];
    if (t.isExpressionStatement(stmt)) {
        const expr = stmt.expression as t.Node & { extra?: Record<string, unknown> };
        // Drop the wrapping-paren bookkeeping babel attaches so recast doesn't reprint
        // the `( … )` we only added to force expression parsing.
        if (expr.extra) {
            delete expr.extra.parenthesized;
            delete expr.extra.parenStart;
        }
        return expr;
    }
    throw new Error(`Not an expression: ${src}`);
}

/** Depth-first walk of an AST subtree, visiting every node. */
function walk(node: unknown, visit: (n: t.Node) => void): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const item of node) walk(item, visit);
        return;
    }
    const n = node as t.Node;
    if (typeof (n as { type?: unknown }).type === 'string') {
        visit(n);
    }
    for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
        if (key === 'tokens' || key === 'comments' || key === 'original') continue;
        walk((node as Record<string, unknown>)[key], visit);
    }
}
