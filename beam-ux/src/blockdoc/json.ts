/**
 * `@splicewire/beam-ux/blockdoc/json` — the **browser-safe** JSON projection of a BlockDoc.
 *
 * The BlockDoc lens ({@link ./lens}) is the *source-of-truth* shape: every node holds a live
 * recast/@babel AST reference, so it is lossless but pulls Babel — it is a **build/server** concern.
 * This module is its AST-free mirror: a plain, serializable `JsonNode` tree (no `node` handles) plus
 * a pure edit-op set. It imports **types only** from the lens, so it never drags recast/@babel into a
 * client bundle — the visual editor canvas (ticket 02) edits + persists THIS shape.
 *
 * The seam (ticket 01, editor-promotion):
 *   `.tsx` ──parse──▶ BlockDoc ──toJson──▶ JsonNode[]  (browser edits + persists as JSON)
 *   JsonNode[] ──jsonToTsx──▶ `.tsx`   (pure printer; no Babel — safe anywhere)
 *   JsonNode[] ──fromJson──▶ BlockDoc  (re-parses; Babel-side, exported from `./blockdoc`)
 *
 * Opacity (a sealed node) is a per-node POLICY overlay computed by the canvas from
 * (permission × source-reachability); the only intrinsic seal here is {@link JsonOpaque} — a dynamic
 * island the static lens could not decompose (a `.map`, a conditional), carried verbatim so the tree
 * always round-trips. This is the ONE opaque-island concept (the host's forked `isIsland` is retired).
 */

import type { BlockChild, BlockDoc, BlockNode, PropKind } from './types.js';

// ---------------------------------------------------------------------------
// The JSON shape — an AST-free mirror of BlockChild, discriminated by `kind`.
// ---------------------------------------------------------------------------

/** A prop on a {@link JsonBlock} — mirrors `BlockProp` minus the AST `node` handle. */
export interface JsonProp {
    name: string;
    kind: PropKind;
    /** Decoded literal for string/number/boolean; source text (`{…}` stripped) for `expression`. */
    value: string | number | boolean;
}

/** An intrinsic element or component node. `isComponent` ⇒ a registered PascalCase component. */
export interface JsonBlock {
    kind: 'block';
    /** `null` for a fragment (`<>…</>`). */
    name: string | null;
    isComponent: boolean;
    props: JsonProp[];
    children: JsonNode[];
    /** Mirrors `BlockNode.dynamic` (an undecomposable spread attribute, etc). Descriptive. */
    dynamic: boolean;
}

/** A text leaf. */
export interface JsonText {
    kind: 'text';
    value: string;
}

/**
 * A sealed dynamic island — the AST-free mirror of `OpaqueNode`. Carried verbatim; the canvas
 * renders it read-only (position/delete only) and `jsonToTsx` re-emits its `source` unchanged.
 */
export interface JsonOpaque {
    kind: 'opaque';
    reason: 'map' | 'conditional' | 'ternary' | 'expression' | 'spread';
    /** Verbatim source of the expression, `{…}` braces included. */
    source: string;
}

export type JsonNode = JsonBlock | JsonText | JsonOpaque;

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
// toJson — BlockDoc (AST lens) ▶ JSON projection. Pure; safe to call server-side after parse.
// ---------------------------------------------------------------------------

/** Project a BlockDoc, a single BlockNode, or a BlockChild[] into the AST-free JSON tree. */
export function toJson(input: BlockDoc | BlockNode | BlockChild[]): JsonDoc {
    const roots: BlockChild[] = Array.isArray(input)
        ? input
        : 'roots' in input
          ? input.roots
          : [input];
    return roots.map(childToJson);
}

function childToJson(child: BlockChild): JsonNode {
    if (child.type === 'text') return { kind: 'text', value: child.value };
    if (child.type === 'opaque') {
        return { kind: 'opaque', reason: child.reason, source: child.source };
    }
    return {
        kind: 'block',
        name: child.name,
        isComponent: child.isComponent,
        props: child.props.map((p) => ({ name: p.name, kind: p.kind, value: p.value })),
        children: child.children.map(childToJson),
        dynamic: child.dynamic,
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
    return doc.map((n) => printNode(n, depth) + ';').join('\n');
}

function printNode(node: JsonNode, depth: number): string {
    const pad = INDENT.repeat(depth);
    if (isJsonText(node)) return pad + escapeText(node.value.trim());
    if (isJsonOpaque(node)) return pad + node.source;

    const tag = node.name ?? '';
    const attrs = node.props.map(printProp).join('');
    const open = node.name === null ? '<>' : `<${tag}${attrs}>`;
    const close = node.name === null ? '</>' : `</${tag}>`;

    if (node.children.length === 0) {
        // A fragment always uses the paired form; a self-closing element otherwise.
        return node.name === null ? pad + '<></>' : pad + `<${tag}${attrs} />`;
    }

    // A leaf (text-only children) prints inline for readability + stable round-trip.
    if (isLeafText(node)) {
        const inner = node.children.map((c) => escapeText((c as JsonText).value.trim())).join('');
        return `${pad}${open}${inner}${close}`;
    }

    const kids = node.children.map((c) => printNode(c, depth + 1)).join('\n');
    return `${pad}${open}\n${kids}\n${pad}${close}`;
}

function printProp(p: JsonProp): string {
    switch (p.kind) {
        case 'boolean-shorthand':
            return ` ${p.name}`;
        case 'string':
            return ` ${p.name}=${JSON.stringify(String(p.value))}`;
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
    const idx = path.split('.').map(Number);
    let node: JsonNode | undefined = doc[idx[0]];
    for (let i = 1; i < idx.length; i++) {
        if (!node || !isJsonBlock(node)) return null;
        node = node.children[idx[i]];
    }
    return node ?? null;
}

/** Immutably replace the node at `path` with `fn(node)`. Returns a new doc. */
export function updateAt(doc: JsonDoc, path: string, fn: (node: JsonNode) => JsonNode): JsonDoc {
    const idx = path.split('.').map(Number);

    const recurChildren = (nodes: JsonNode[], depth: number): JsonNode[] => {
        const ci = idx[depth];
        const child = nodes[ci];
        if (child === undefined) return nodes;
        const next = nodes.slice();
        next[ci] = recur(child, depth);
        return next;
    };

    const recur = (node: JsonNode, depth: number): JsonNode => {
        if (depth === idx.length - 1) return fn(node);
        if (!isJsonBlock(node)) return node;
        return { ...node, children: recurChildren(node.children, depth + 1) };
    };

    return recurChildren(doc, 0);
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
 * Duplicate the node at `path`, inserting the clone as the next sibling. A structural (deep) clone —
 * no new node has any identity beyond its position, so this is exactly "insert a second copy of this
 * subtree right after the original." No-op (returns `doc` unchanged) if `path` doesn't resolve.
 */
export function duplicateAt(doc: JsonDoc, path: string): JsonDoc {
    const node = getAt(doc, path);
    if (!node) return doc;

    return insertInto(doc, parentOf(path), indexOf(path) + 1, structuredClone(node));
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

/** Set a leaf block's text (replaces its children with a single text node), immutably. */
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
