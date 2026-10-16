import { P as PropKind, b as BlockDoc, B as BlockNode, c as BlockChild } from '../types-K1Eu-Q2o.js';
import '@babel/types';

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

/** A prop on a {@link JsonBlock} — mirrors `BlockProp` minus the AST `node` handle. */
interface JsonProp {
    name: string;
    kind: PropKind;
    /**
     * Decoded literal for string/number/boolean; source text (`{…}` stripped) for `expression`.
     * `null` is a legitimate string-kind value — e.g. Laravel's default `ConvertEmptyStringsToNull`
     * middleware turns a cleared string attr's `''` into a real `null` before it's ever persisted, so
     * a round-tripped doc can carry `null` here even though nothing in this package writes it directly.
     */
    value: string | number | boolean | null;
}
/** An intrinsic element or component node. `isComponent` ⇒ a registered PascalCase component. */
interface JsonBlock {
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
interface JsonText {
    kind: 'text';
    value: string;
}
/**
 * A sealed dynamic island — the AST-free mirror of `OpaqueNode`. Carried verbatim; the canvas
 * renders it read-only (position/delete only) and `jsonToTsx` re-emits its `source` unchanged.
 */
interface JsonOpaque {
    kind: 'opaque';
    reason: 'map' | 'conditional' | 'ternary' | 'expression' | 'spread';
    /** Verbatim source of the expression, `{…}` braces included. */
    source: string;
}
type JsonNode = JsonBlock | JsonText | JsonOpaque;
/** A JSON document — the roots of a page body. Edit ops address into this array. */
type JsonDoc = JsonNode[];
declare const isJsonBlock: (n: JsonNode) => n is JsonBlock;
declare const isJsonText: (n: JsonNode) => n is JsonText;
declare const isJsonOpaque: (n: JsonNode) => n is JsonOpaque;
/** A block whose children are all text (an inline-editable leaf, e.g. `<h2>Title</h2>`). */
declare const isLeafText: (b: JsonBlock) => boolean;
/** Void HTML elements — React forbids passing them ANY children. */
declare const VOID_TAGS: Set<string>;
/** Project a BlockDoc, a single BlockNode, or a BlockChild[] into the AST-free JSON tree. */
declare function toJson(input: BlockDoc | BlockNode | BlockChild[]): JsonDoc;
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
declare function jsonToTsx(doc: JsonDoc, depth?: number): string;
declare const parentOf: (path: string) => string;
declare const indexOf: (path: string) => number;
/** The node at `path`, or `null` if the path doesn't resolve (or lands on a non-block mid-chain). */
declare function getAt(doc: JsonDoc, path: string): JsonNode | null;
/** Immutably replace the node at `path` with `fn(node)`. Returns a new doc. */
declare function updateAt(doc: JsonDoc, path: string, fn: (node: JsonNode) => JsonNode): JsonDoc;
/** Insert `node` as `parentPath`'s child at `index`. `parentPath === ''` targets the doc root array. */
declare function insertInto(doc: JsonDoc, parentPath: string, index: number, node: JsonNode): JsonDoc;
/** Remove the node at `path`. Returns a new doc. */
declare function removeAt(doc: JsonDoc, path: string): JsonDoc;
/**
 * Duplicate the node at `path`, inserting the clone as the next sibling. A structural (deep) clone —
 * no new node has any identity beyond its position, so this is exactly "insert a second copy of this
 * subtree right after the original." No-op (returns `doc` unchanged) if `path` doesn't resolve.
 */
declare function duplicateAt(doc: JsonDoc, path: string): JsonDoc;
/** Move the node at `from` to be the sibling immediately before `target`. No-op if dropping into self. */
declare function moveBefore(doc: JsonDoc, from: string, target: string): JsonDoc;
/** Move the node at `from` to be the sibling immediately after `target`. No-op if dropping into self. */
declare function moveAfter(doc: JsonDoc, from: string, target: string): JsonDoc;
/** Set (or add) a prop by name, immutably. `kind` defaults to `string`. */
declare function setProp(block: JsonBlock, name: string, value: string | number | boolean, kind?: PropKind): JsonBlock;
/** Remove a prop by name, immutably. */
declare function removeProp(block: JsonBlock, name: string): JsonBlock;
/** Set a leaf block's text (replaces its children with a single text node), immutably. */
declare function setText(block: JsonBlock, value: string): JsonBlock;
/** Read a prop's decoded value by name (or `undefined`). */
declare const propValue: (block: JsonBlock, name: string) => JsonProp["value"] | undefined;
interface StyleRow {
    k: string;
    v: string;
}
declare const styleRows: (s: string) => StyleRow[];
declare const joinStyle: (rows: StyleRow[]) => string;
/** Parse an inline `style` string into a React style object (camelCased props). */
declare function parseStyle(s: string): Record<string, string>;

export { type JsonBlock, type JsonDoc, type JsonNode, type JsonOpaque, type JsonProp, type JsonText, type StyleRow, VOID_TAGS, duplicateAt, getAt, indexOf, insertInto, isJsonBlock, isJsonOpaque, isJsonText, isLeafText, joinStyle, jsonToTsx, moveAfter, moveBefore, parentOf, parseStyle, propValue, removeAt, removeProp, setProp, setText, styleRows, toJson, updateAt };
