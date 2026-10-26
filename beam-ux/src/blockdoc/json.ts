import { assertBlockStyle } from './style.js';
import { freshBlockIds } from './identity.js';
import { assertReferenceName } from './component-interface.js';
import { assertFieldPath, assertRepeat, assertCondition } from './bindings.js';
/**
 * `@splicewire/beam-ux/jsondoc` — the **browser-safe** JSON projection of a TsxTree.
 *
 * The TsxTree lens ({@link ./lens}) is the *source-of-truth* shape: every node holds a live
 * recast/@babel AST reference, so it is lossless but pulls Babel — it is a **build/server** concern.
 * This module is its AST-free mirror: a plain, serializable `JsonNode` tree (no `node` handles) plus
 * a pure edit-op set. It imports **types only** from the lens, so it never drags recast/@babel into a
 * client bundle — the visual editor canvas (ticket 02) edits + persists THIS shape.
 *
 * The seam (ticket 01, editor-promotion):
 *   `.tsx` ──parse──▶ TsxTree ──toJson──▶ JsonNode[]  (browser edits + persists as JSON)
 *   JsonNode[] ──jsonToTsx──▶ `.tsx`   (pure printer; no Babel — safe anywhere)
 *   JsonNode[] ──fromJson──▶ TsxTree  (re-parses; Babel-side, exported from `./blockdoc`)
 *
 * Opacity (a sealed node) is a per-node POLICY overlay computed by the canvas from
 * (permission × source-reachability); the only intrinsic seal here is {@link JsonOpaque} — a dynamic
 * island the static lens could not decompose (a `.map`, a conditional), carried verbatim so the tree
 * always round-trips. This is the ONE opaque-island concept (the host's forked `isIsland` is retired).
 */

import type { BlockChild, TsxTree, BlockNode, PropKind } from './types.js';

// ---------------------------------------------------------------------------
// The JSON shape — an AST-free mirror of BlockChild, discriminated by `kind`.
// ---------------------------------------------------------------------------

// Generated from PHP JsonNode's declared morph union; no browser hand-mirror of its arms.
import type { JsonNode, JsonBlockNode, JsonTextNode, JsonOpaqueNode, JsonProp } from '@splicewire/beam-resources/types/beam-ux';
export type { JsonNode, JsonBlockNode, JsonTextNode, JsonOpaqueNode, JsonProp };
export type JsonBlock = JsonBlockNode;
export type JsonText = JsonTextNode;
export type JsonOpaque = JsonOpaqueNode;

/** A JSON document — the roots of a page body. Edit ops address into this array. */
export type JsonDoc = JsonNode[];

export const isJsonBlock = (n: JsonNode): n is JsonBlock => n.kind === 'block';
export const isJsonText = (n: JsonNode): n is JsonText => n.kind === 'text';
export const isJsonOpaque = (n: JsonNode): n is JsonOpaque => n.kind === 'opaque';

/** A block whose children are all text (an inline-editable leaf, e.g. `<h2>Title</h2>`). */
export const isLeafText = (b: JsonBlock): boolean =>
    b.children.length > 0 && b.children.every((c) => isJsonText(c));

/** Void HTML elements — React forbids passing them ANY children. */
export const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// ---------------------------------------------------------------------------
// toJson — TsxTree (AST lens) ▶ JSON projection. Pure; safe to call server-side after parse.
// ---------------------------------------------------------------------------

/** Project a TsxTree, a single BlockNode, or a BlockChild[] into the AST-free JSON tree. */
export function toJson(input: TsxTree | BlockNode | BlockChild[]): JsonDoc {
    const roots: BlockChild[] = Array.isArray(input)
        ? input
        : 'roots' in input
          ? input.roots
          : [input];
    return roots.map(childToJson);
}

function childToJson(child: BlockChild): JsonNode {
    if (child.type === 'text') return { kind: 'text', value: child.value, ...(child.field != null ? { field: child.field } : {}), ...(child.prop != null ? { prop: child.prop } : {}) };
    if (child.type === 'opaque') {
        return { kind: 'opaque', reason: child.reason, source: child.source };
    }
    return {
        kind: 'block',
        name: child.name,
        isComponent: child.isComponent,
        props: child.props.map((p) => ({ name: p.name, kind: p.kind, value: p.value })),
        children: child.children.map(childToJson),
        ...(child.slots ? {slots: Object.fromEntries(Object.entries(child.slots).map(([name, nodes]) => [name, nodes.map(childToJson)]))} : {}),
        dynamic: child.dynamic,
        ...(child.style ? { style: child.style } : {}),
        ...(child.repeat ? { repeat: child.repeat } : {}),
        ...(child.when ? { when: child.when } : {}),
        ...(child.component ? {component: child.component} : {}),
    };
}

// ---------------------------------------------------------------------------
// jsonToTsx — JSON projection ▶ `.tsx` source. A pure string printer (NO Babel).
// ---------------------------------------------------------------------------

const INDENT = '  ';

/**
 * Print a JSON document to indented JSX source (the import/export boundary — no Babel needed). Each
 * root prints as its own top-level JSX expression STATEMENT (a trailing `;`) — bare adjacent JSX
 * elements/fragments with no separator are a parse error ("Adjacent JSX elements must be wrapped in
 * an enclosing tag"), so a multi-root document (the normal shape for a real page: several top-level
 * sections) needs an explicit statement terminator between roots to stay re-parseable — verified
 * live: `fromJson()`, this module's own round-trip closer (`parse(jsonToTsx(doc))`), threw on any
 * multi-root doc before this fix; every existing test happened to only cover single-root docs. Only
 * affects these top-level SIBLINGS — a node's own children are printed by `printNode` directly, never
 * through this function, so nested JSX (which doesn't need statement separators, being inside a
 * parent's tags already) is untouched.
 */
export function jsonToTsx(doc: JsonDoc, depth = 0): string {
    const componentBody = doc.length === 1 && isJsonBlock(doc[0]) && !!doc[0].component;
    return doc.map((n) => printNode(n, depth, componentBody) + ';').join('\n');
}

function printNode(node: JsonNode, depth: number, componentBody = false): string {
    const pad = INDENT.repeat(depth);
    if (isJsonText(node)) {
        if (node.prop != null) {
            assertReferenceName(node.prop);
            return pad + `{${node.prop}}`;
        }
        if (node.field != null) {
            assertFieldPath(node.field);
            return pad + `{bdText(${JSON.stringify(node.field)}, ${JSON.stringify(node.value)})}`;
        }
        const [lead, run, trail] = textRun(node.value);
        return [lead ? pad + SPACE : '', run !== '' ? pad + escapeText(run) : '', trail ? pad + SPACE : '']
            .filter((line) => line !== '')
            .join('\n');
    }
    if (isJsonOpaque(node)) return pad + node.source;

    if (node.name === 'Slot' && !componentBody) {
        const name = node.props.find(prop => prop.name === 'name')?.value ?? 'children';
        assertReferenceName(name);
        const fallback = node.children.length === 0 ? '' : ` ?? ${printSlotValue(node.children, depth)}`;
        return pad + `{${name}${fallback}}`;
    }

    const tag = node.name ?? '';
    const attrs = jsxAttributes(node, depth, componentBody);
    const open = node.name === null ? '<>' : `<${tag}${attrs}>`;
    const close = node.name === null ? '</>' : `</${tag}>`;

    if (node.children.length === 0) {
        // A fragment always uses the paired form; a self-closing element otherwise.
        return node.name === null ? pad + '<></>' : pad + `<${tag}${attrs} />`;
    }

    // A leaf (text-only children) prints inline for readability + stable round-trip.
    if (isLeafText(node) && node.children.every((child) => !('field' in child) && !('prop' in child))) {
        const [lead, run, trail] = textRun(node.children.map((c) => (c as JsonText).value).join(''));
        return `${pad}${open}${lead ? SPACE : ''}${escapeText(run)}${trail ? SPACE : ''}${close}`;
    }

    // A run of layout whitespace prints nothing, and takes no line.
    const kids = node.children.map((c) => printNode(c, depth + 1, componentBody)).filter((part) => part !== '').join('\n');
    return `${pad}${open}\n${kids}\n${pad}${close}`;
}

/** A space a reader sees, where a line break would otherwise drop it (JSX trims whitespace that touches one). */
const SPACE = '{" "}';

/**
 * A text run as JSX reads it back: whitespace that touches a line break is layout, and drops; a leading or trailing
 * space on the line of its neighbour is one the reader sees, and must survive the run printing on its own line. The
 * lens reads the `{" "}` that carries it back as a text node " ", so print, parse and print again agree. Mirrors
 * laravel-beam-ux's `JsonDocPrinter::textRun()`.
 */
function textRun(value: string): [lead: boolean, run: string, trail: boolean] {
    const [, edgeLead, run, edgeTrail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(value) as RegExpExecArray;
    const lead = edgeLead !== '' && !edgeLead.includes('\n');
    const trail = edgeTrail !== '' && !edgeTrail.includes('\n');
    // Whitespace only: one space if a reader sees it, nothing if it is layout.
    return run === '' ? [lead, '', false] : [lead, run, trail];
}

/**
 * A block's JSX attributes, each with its leading space: its props, then the lens-owned fields (`bdStyle`,
 * `bdRepeat`, `bdWhen`), then its named slots. Exported so the MDX printer (`@splicewire/beam-mdx/lens`)
 * prints a component's attributes exactly as here (ux-0233 d2).
 */
export function jsxAttributes(node: JsonBlock, depth = 0, componentBody = false): string {
    if (node.style) assertBlockStyle(node.style);
    if (node.repeat) assertRepeat(node.repeat);
    if (node.when) assertCondition(node.when);
    const attrs = node.props.map(printProp).join('') + (node.style ? ` bdStyle={${JSON.stringify(node.style)}}` : '')
        + (node.repeat ? ` bdRepeat={${JSON.stringify(node.repeat)}}` : '')
        + (node.when ? ` bdWhen={${JSON.stringify(node.when)}}` : '')
        + (node.component ? ` bdComponent={${JSON.stringify(node.component)}}` : '');
    const slotAttrs = Object.entries(node.slots ?? {}).map(([name, children]) => {
        assertReferenceName(name);
        return ` ${name}={${printSlotValue(children, depth, componentBody)}}`;
    }).join('');
    return attrs + slotAttrs;
}

function printProp(p: JsonProp): string {
    switch (p.kind) {
        case 'prop':
            assertReferenceName(p.value);
            return ` ${p.name}={${p.value}}`;
        case 'field':
            assertFieldPath(p.value);
            return ` ${p.name}={bdField(${JSON.stringify(p.value)})}`;
        case 'boolean-shorthand':
            return ` ${p.name}`;
        case 'string':
            // `String(null)` is `"null"` — a JS footgun that would otherwise print the 4-character
            // text "null" as the attribute's literal value instead of an empty string.
            return ` ${p.name}=${JSON.stringify(String(p.value ?? ''))}`;
        case 'number':
            return ` ${p.name}={${p.value}}`;
        case 'boolean':
            return ` ${p.name}={${p.value ? 'true' : 'false'}}`;
        case 'expression':
        default: {
            // `value` is the source text with `{…}` already stripped by the lens; re-wrap it.
            const src = String(p.value).trim();
            return ` ${p.name}={${src}}`;
        }
    }
}

function printSlotValue(children: JsonNode[], depth: number, componentBody = false): string {
    if (children.length === 1 && isJsonBlock(children[0]) && children[0].name !== 'Slot') return printNode(children[0], depth, componentBody).trimStart();
    return `<>${children.map(child => printNode(child, depth + 1, componentBody)).filter((part) => part !== '').join('\n')}</>`;
}

/** Escape a text leaf for JSX body content (only `{`, `}`, `<`, `>` are special). */
function escapeText(s: string): string {
    return s.replace(/[{}<>]/g, (c) => `{'${c}'}`);
}

// ---------------------------------------------------------------------------
// Paths + edit ops — pure, immutable. Address into a JsonDoc with a dotted index chain:
//   "0" = doc[0]; "0.2" = doc[0].children[2]. (A single-root body is doc=[root], "0"=root — so
//   this subsumes the host's old single-root path model exactly.)
// ---------------------------------------------------------------------------

export const parentOf = (path: string): string => path.split('.').slice(0, -1).join('.');
export const indexOf = (path: string): number => Number(path.split('.').pop());

/** The node at `path`, or `null` if the path doesn't resolve (or lands on a non-block mid-chain). */
export function getAt(doc: JsonDoc, path: string): JsonNode | null {
    const parts = path.split('.');
    if (!/^\d+$/.test(parts[0])) return null;
    let node: JsonNode | undefined = doc[Number(parts[0])];
    for (let i = 1; i < parts.length; i++) {
        if (!node || !isJsonBlock(node)) return null;
        if (parts[i] === 'slots') {
            const name = parts[++i];
            try { assertReferenceName(name); } catch { return null; }
            node = slotContainer(node.slots?.[name] ?? []);
        } else {
            if (!/^\d+$/.test(parts[i])) return null;
            node = node.children[Number(parts[i])];
        }
    }
    return node ?? null;
}

/** Slot containers exist only as path cursors; never persisted as extra JsonNode arms. */
function slotContainer(children: JsonNode[]): JsonBlock {
    return {kind:'block', name:null, isComponent:false, dynamic:false, props:[], children};
}

/** Immutably replace a node (including one inside a named slot). */
export function updateAt(doc: JsonDoc, path: string, fn: (node: JsonNode) => JsonNode): JsonDoc {
    if (!getAt(doc, path)) return doc;
    const parts = path.split('.');
    const recur = (node: JsonNode, offset: number): JsonNode => {
        if (offset === parts.length) return fn(node);
        if (!isJsonBlock(node)) return node;
        if (parts[offset] === 'slots') {
            const name = parts[offset + 1];
            const changed = recur(slotContainer(node.slots?.[name] ?? []), offset + 2);
            return isJsonBlock(changed) ? {...node, slots:{...node.slots, [name]:changed.children}} : node;
        }
        const index = Number(parts[offset]);
        return {...node, children:node.children.map((child, i) => i === index ? recur(child, offset + 1) : child)};
    };
    return doc.map((node, i) => i === Number(parts[0]) ? recur(node, 1) : node);
}

/** Insert `node` as `parentPath`'s child at `index`. `parentPath === ''` targets the doc root array. */
export function insertInto(doc: JsonDoc, parentPath: string, index: number, node: JsonNode): JsonDoc {
    if (parentPath === '') {
        const next = doc.slice();
        next.splice(index, 0, node);
        return next;
    }
    return updateAt(doc, parentPath, (p) => {
        if (!isJsonBlock(p)) return p;
        const children = p.children.slice();
        children.splice(index, 0, node);
        return { ...p, children };
    });
}

/** Remove the node at `path`. Returns a new doc. */
export function removeAt(doc: JsonDoc, path: string): JsonDoc {
    const parent = parentOf(path);
    const i = indexOf(path);
    if (parent === '') {
        const next = doc.slice();
        next.splice(i, 1);
        return next;
    }
    return updateAt(doc, parent, (p) => {
        if (!isJsonBlock(p)) return p;
        const children = p.children.slice();
        children.splice(i, 1);
        return { ...p, children };
    });
}

/**
 * Duplicate as the next sibling, giving every copied block a fresh identity.
 * No-op (returns `doc` unchanged) if `path` does not resolve.
 */
export function duplicateAt(doc: JsonDoc, path: string): JsonDoc {
    const node = getAt(doc, path);
    if (!node) return doc;

    return insertInto(doc, parentOf(path), indexOf(path) + 1, freshBlockIds(node));
}

/** Move the node at `from` to be the sibling immediately before `target`. No-op if dropping into self. */
export function moveBefore(doc: JsonDoc, from: string, target: string): JsonDoc {
    return moveTo(doc, from, target, 'before');
}

/** Move the node at `from` to be the sibling immediately after `target`. No-op if dropping into self. */
export function moveAfter(doc: JsonDoc, from: string, target: string): JsonDoc {
    return moveTo(doc, from, target, 'after');
}

function moveTo(doc: JsonDoc, from: string, target: string, edge: 'before' | 'after'): JsonDoc {
    if (from === target || target.startsWith(`${from}.`)) return doc;
    const node = getAt(doc, from);
    if (!node) return doc;

    const removed = removeAt(doc, from);
    const tParent = parentOf(target);
    let tIndex = indexOf(target) + (edge === 'after' ? 1 : 0);

    // Removing an earlier sibling under the same parent shifts the target index down by one.
    if (parentOf(from) === tParent && indexOf(from) < tIndex) tIndex -= 1;

    // If the target parent vanished with the removal, append to the doc root.
    if (tParent !== '' && !getAt(removed, tParent)) {
        return insertInto(removed, '', removed.length, node);
    }
    return insertInto(removed, tParent, tIndex, node);
}

// ---------------------------------------------------------------------------
// Prop + text mutations — immutable single-node helpers (compose with updateAt).
// ---------------------------------------------------------------------------

/** Set (or add) a prop by name, immutably. `kind` defaults to `string`. */
export function setProp(
    block: JsonBlock,
    name: string,
    value: string | number | boolean,
    kind: PropKind = 'string',
): JsonBlock {
    const props = block.props.slice();
    const at = props.findIndex((p) => p.name === name);
    const prop: JsonProp = { name, kind, value };
    if (at >= 0) props[at] = prop;
    else props.push(prop);
    return { ...block, props };
}

/** Remove a prop by name, immutably. */
export function removeProp(block: JsonBlock, name: string): JsonBlock {
    return { ...block, props: block.props.filter((p) => p.name !== name) };
}

/** @deprecated Prefer immutable JsonNode transforms; retained for the documented jsondoc API. */
export function setText(block: JsonBlock, value: string): JsonBlock {
    return { ...block, children: [{ kind: 'text', value }] };
}

/** Read a prop's decoded value by name (or `undefined`). */
export const propValue = (block: JsonBlock, name: string): JsonProp['value'] | undefined =>
    block.props.find((p) => p.name === name)?.value;

// ---------------------------------------------------------------------------
// Style helpers — inline `style` (a CSS string on the canvas) ⟷ declaration rows / React style object.
// The canvas edits `style` as a raw CSS string; these keep that presentation pure + shared.
// ---------------------------------------------------------------------------

export interface StyleRow { k: string; v: string }

export const styleRows = (s: string): StyleRow[] =>
    s.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
        const i = d.indexOf(':');
        return { k: d.slice(0, i).trim(), v: d.slice(i + 1).trim() };
    });

export const joinStyle = (rows: StyleRow[]): string =>
    rows.filter((r) => r.k).map((r) => `${r.k}:${r.v}`).join(';');

/** Parse an inline `style` string into a React style object (camelCased props). */
export function parseStyle(s: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const decl of s.split(';')) {
        const i = decl.indexOf(':');
        if (i < 0) continue;
        const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        if (prop) out[prop] = decl.slice(i + 1).trim();
    }
    return out;
}
