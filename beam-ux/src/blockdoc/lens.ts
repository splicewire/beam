import { assertBlockStyle, legacyStyle, type BlockStyle } from './style.js';
import { declaredProp, declaredSlot, componentLensContext, readComponentDefinition, type LensContext } from './component-interface.js';
import { assertFieldPath, assertRepeat, assertCondition, type RepeatDeclaration, type DataCondition } from './bindings.js';
/**
 * TsxTree lens core — lossless `.tsx` ⟷ TsxTree.
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
    TsxTree,
    BlockNode,
    BlockProp,
    OpaqueNode,
    PropKind,
    TextNode,
} from './types.js';

/** The recast parser config — a single instance so parse + reprint agree on tokens. */
const parser = babelTsParser;

/** Parse a `.tsx` source string into an editable TsxTree lens. */
export function parse(tsx: string, context: LensContext = {}): TsxTree {
    const ast = recast.parse(tsx, { parser }) as File;
    const roots: BlockNode[] = [];
    const seen = new Set<t.Node>();

    // Walk the whole program collecting *top-level* JSX (a JSX node whose nearest JSX
    // ancestor is not itself in the tree). recast's AST is estree-ish but node shapes
    // match @babel/types, so we hand-walk to avoid pulling @babel/traverse at runtime.
    walk(ast.program, (node) => {
        if ((t.isJSXElement(node) || t.isJSXFragment(node)) && !seen.has(node)) {
            const block = buildBlock(node, seen, context);
            if (block) roots.push(block);
        }
    });

    return { ast, roots };
}

/** Serialize a TsxTree (or a raw AST) back to a `.tsx` string. */
export function print(input: TsxTree | File): string {
    const ast = 'ast' in (input as TsxTree) ? (input as TsxTree).ast : (input as File);
    return recast.print(ast).code;
}

// ---------------------------------------------------------------------------
// Lens construction
// ---------------------------------------------------------------------------

function buildBlock(
    el: t.JSXElement | t.JSXFragment,
    seen: Set<t.Node>,
    context: LensContext,
): BlockNode {
    seen.add(el);
    const isElement = t.isJSXElement(el);
    const opening = isElement ? el.openingElement : null;

    const name = opening ? jsxName(opening.name) : null;
    const isComponent = !!name && /^[A-Z]/.test(name.replace(/^.*\./, name[0]));

    const props: BlockProp[] = [];
    const slots: Record<string, BlockChild[]> = {};
    let style: BlockStyle | undefined;
    let legacy: BlockStyle | undefined;
    let repeat: RepeatDeclaration | undefined;
    let when: DataCondition | undefined;
    let clickEvent: { name: string; label?: string } | undefined;
    let component: import('@splicewire/beam-resources/types/beam-ux').ComponentDefinitionData | undefined;
    let dynamic = !isElement ? false : opening!.attributes.some((a) => t.isJSXSpreadAttribute(a));
    if (opening) {
        // Resolve the interface before any expression or Slot, regardless of JSX attribute order.
        const declarations = opening.attributes.filter((attr) => t.isJSXAttribute(attr)
            && t.isJSXIdentifier(attr.name) && attr.name.name === 'bdComponent');
        if (declarations.length > 1) throw new Error('A root has only one component interface');
        const declaration = declarations[0];
        if (declaration && t.isJSXAttribute(declaration)) {
            if (!t.isJSXExpressionContainer(declaration.value)) throw new Error('bdComponent requires a literal object');
            component = readComponentDefinition(styleLiteral(declaration.value.expression));
            context = componentLensContext(component, context);
        }
        for (const attr of opening.attributes) {
            if (t.isJSXAttribute(attr)) {
                const value = t.isJSXExpressionContainer(attr.value) ? attr.value.expression : attr.value;
                const slot = context.profile?.nodes.find(entry => entry.name === name)?.slots?.find(slot => slot.name === jsxName(attr.name));
                if (slot && (t.isJSXElement(value) || t.isJSXFragment(value))) {
                    const slotBlock = buildBlock(value, seen, context);
                    slots[slot.name] = t.isJSXFragment(value) ? slotBlock.children : [slotBlock];
                    continue;
                }
                if (t.isJSXIdentifier(attr.name) && attr.name.name === 'bdComponent') {
                    continue;
                } else if (t.isJSXIdentifier(attr.name) && attr.name.name === 'bdStyle') {
                    if (!t.isJSXExpressionContainer(attr.value)) throw new Error('bdStyle requires a literal object');
                    const value = styleLiteral(attr.value.expression);
                    assertBlockStyle(value);
                    style = value;
                } else if (t.isJSXIdentifier(attr.name) && ['bdRepeat', 'bdWhen'].includes(attr.name.name)) {
                    if (!t.isJSXExpressionContainer(attr.value)) throw new Error(`${attr.name.name} requires a literal object`);
                    const value = styleLiteral(attr.value.expression);
                    if (attr.name.name === 'bdRepeat') { assertRepeat(value); repeat = value; }
                    else { assertCondition(value); when = value; }
                } else if (t.isJSXIdentifier(attr.name) && attr.name.name === 'bdEvent') {
                    const value = t.isJSXExpressionContainer(attr.value) ? clickEventLiteral(attr.value.expression) : undefined;
                    if (value) clickEvent = value;
                    else {
                        const prop = buildProp(attr, context);
                        if (prop.kind === 'expression') sealSubtree(attr, seen);
                        props.push(prop);
                    }
                } else {
                    const prop = buildProp(attr, context);
                    // JSX carried as opaque attribute code belongs to that attribute, not another root.
                    if (prop.kind === 'expression') sealSubtree(attr, seen);
                    if (prop.name === 'style' && prop.kind === 'string') {
                        // A structured style takes precedence; legacy text contributes the base.
                        legacy = legacyStyle(String(prop.value));
                    } else props.push(prop);
                }
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
            children.push(buildBlock(child, seen, context));
        } else if (t.isJSXExpressionContainer(child)) {
            const expr = child.expression;
            if (t.isJSXEmptyExpression(expr)) {
                // A `{/* comment */}` container: comments hang off the empty expression.
                continue;
            }
            const slotIdentifier = t.isIdentifier(expr) ? expr : t.isLogicalExpression(expr, {operator: '??'}) && t.isIdentifier(expr.left) ? expr.left : null;
            const fallback = t.isLogicalExpression(expr, {operator: '??'}) ? expr.right : null;
            if (slotIdentifier && declaredSlot(context, slotIdentifier.name) && (fallback === null || t.isJSXElement(fallback) || t.isJSXFragment(fallback))) {
                const fallbackBlock = fallback ? buildBlock(fallback as t.JSXElement | t.JSXFragment, seen, context) : null;
                children.push({type:'block', name:'Slot', isComponent:true, props: slotIdentifier.name === 'children' ? [] : [{name:'name', kind:'string', value:slotIdentifier.name, node:child}], children: fallbackBlock ? (t.isJSXFragment(fallback) ? fallbackBlock.children : [fallbackBlock]) : [], dynamic:false, node:child});
            } else if (t.isIdentifier(expr) && declaredProp(context, expr.name)) {
                children.push({type:'text', value:'', prop:expr.name, node:child});
            } else if (t.isCallExpression(expr) && t.isIdentifier(expr.callee, { name: 'bdText' })) {
                const args = bindingArguments(expr, 2);
                children.push({ type: 'text', field: args[0], value: args[1], node: child });
            } else if (t.isStringLiteral(expr) || t.isTemplateLiteral(expr)) {
                children.push(textFromExpression(child, expr));
            } else {
                // Any other expression child (`{items.map(...)}`, `{cond && <X/>}`, a ternary, a
                // bare identifier, an imported-expression call) is dynamic — captured as an OPAQUE
                // ISLAND (ticket 11): its verbatim source is preserved as an addressable child so the
                // file round-trips losslessly and the canvas can seal it. This works at ANY depth —
                // a `.map` nested inside an editable `<Section>` is captured here in that Section's
                // child loop, so nesting seals + round-trips too.
                sealSubtree(child, seen);
                children.push(opaqueFromExpression(child, expr));
                dynamic = true;
            }
        } else if (t.isJSXSpreadChild(child)) {
            // `{...children}` — a spread child. Opaque, but still preserved verbatim.
            sealSubtree(child, seen);
            children.push(opaqueFromSpreadChild(child));
            dynamic = true;
        }
    }

    return {
        type: 'block',
        name,
        isComponent,
        props,
        children,
        ...(Object.keys(slots).length ? {slots} : {}),
        dynamic,
        ...(style || legacy ? { style: { layers: [...(legacy?.layers ?? []), ...(style?.layers ?? [])] } } : {}),
        ...(repeat ? { repeat } : {}),
        ...(when ? { when } : {}),
        ...(clickEvent ? { clickEvent } : {}),
        ...(component ? {component} : {}),
        node: el,
    };
}

function buildProp(attr: t.JSXAttribute, context: LensContext): BlockProp {
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
        if (t.isIdentifier(expr) && declaredProp(context, expr.name)) {
            return {name, kind:'prop', value:expr.name, node:attr};
        }
        if (t.isCallExpression(expr) && t.isIdentifier(expr.callee, { name: 'bdField' })) {
            return { name, kind: 'field', value: bindingArguments(expr, 1)[0], node: attr };
        }
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

function bindingArguments(call: t.CallExpression, count: number): string[] {
    if (call.arguments.length !== count || call.arguments.some((argument) => !t.isStringLiteral(argument))) {
        throw new Error('A binding helper requires literal string arguments only');
    }
    const args = call.arguments.map((argument) => (argument as t.StringLiteral).value);
    assertFieldPath(args[0]);
    return args;
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

/**
 * Build an {@link OpaqueNode} from a dynamic JSX expression child (`{items.map(...)}`,
 * `{cond && <X/>}`, a ternary, an imported-expression call). The backing node is the WHOLE
 * `JSXExpressionContainer` so recast reprints it byte-for-byte on serialize; `source` is that
 * container printed (`{…}` included) for the canvas preview + the JSON mirror to carry verbatim.
 */
function opaqueFromExpression(
    container: t.JSXExpressionContainer,
    expr: t.Expression,
): OpaqueNode {
    return {
        type: 'opaque',
        reason: opaqueReason(expr),
        source: exprSource(container),
        node: container,
    };
}

/** Build an {@link OpaqueNode} from a `{...spread}` JSX child. */
function opaqueFromSpreadChild(child: t.JSXSpreadChild): OpaqueNode {
    return {
        type: 'opaque',
        reason: 'spread',
        source: exprSource(child),
        node: child,
    };
}

/**
 * Mark every JSX element/fragment inside an opaque subtree as `seen`, so the top-level `parse` walk
 * doesn't re-collect the island's INNER JSX (e.g. the `<li>` inside `{items.map(i => <li/>)}`) as a
 * spurious separate root. The island already carries that JSX verbatim in its `source`.
 */
function sealSubtree(root: t.Node, seen: Set<t.Node>): void {
    walk(root, (n) => {
        if (t.isJSXElement(n) || t.isJSXFragment(n)) seen.add(n);
    });
}

/** Classify WHY an expression is opaque — drives the canvas label; purely descriptive. */
function opaqueReason(expr: t.Expression): OpaqueNode['reason'] {
    if (t.isConditionalExpression(expr)) return 'ternary';
    if (t.isLogicalExpression(expr) && (expr.operator === '&&' || expr.operator === '||')) {
        return 'conditional';
    }
    if (
        t.isCallExpression(expr) &&
        t.isMemberExpression(expr.callee) &&
        t.isIdentifier(expr.callee.property) &&
        expr.callee.property.name === 'map'
    ) {
        return 'map';
    }
    return 'expression';
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

// `patchText` edits an already-parsed text node without loading a parser or builder.
// Keep the module Babel-free and re-export it here as part of the public TSX Lens API.
export { patchText } from './patch-text.js';

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


/** The ONLY object-literal prop the lens interprets. Never eval; spreads/calls/computed keys refuse. */
function styleLiteral(node: t.Node): unknown {
    if (t.isStringLiteral(node) || t.isBooleanLiteral(node)) return node.value;
    if (t.isNumericLiteral(node) && Number.isFinite(node.value)) return node.value;
    if (t.isUnaryExpression(node, {operator: '-'}) && t.isNumericLiteral(node.argument) && Number.isFinite(node.argument.value)) return -node.argument.value;
    if (t.isNullLiteral(node)) return null;
    if (t.isArrayExpression(node)) return node.elements.map(n => {
        if (!n || t.isSpreadElement(n)) throw new Error('bdStyle requires literal array elements');
        return styleLiteral(n);
    });
    if (t.isObjectExpression(node)) {
        const result: Record<string, unknown> = Object.create(null);
        for (const prop of node.properties) {
            if (!t.isObjectProperty(prop) || prop.computed || prop.shorthand ||
                !(t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) throw new Error('bdStyle requires literal object properties');
            const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
            if (['__proto__','prototype','constructor'].includes(key) || Object.hasOwn(result,key)) throw new Error('bdStyle has an invalid literal key');
            result[key] = styleLiteral(prop.value);
        }
        return result;
    }
    throw new Error('bdStyle requires literal values (no executable expressions)');
}

/** `bdEvent` is data only when it exactly matches the published Click Event object shape. */
function clickEventLiteral(node: t.Node): { name: string; label?: string } | undefined {
    try {
        const value = styleLiteral(node);
        if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
        const record = value as Record<string, unknown>;
        if (Object.keys(record).some(key => key !== 'name' && key !== 'label') || typeof record.name !== 'string') return undefined;
        if (record.label !== undefined && typeof record.label !== 'string') return undefined;
        return { name: record.name, ...(record.label !== undefined ? { label: record.label } : {}) };
    } catch {
        return undefined;
    }
}
