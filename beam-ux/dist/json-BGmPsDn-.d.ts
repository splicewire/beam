import { B as BlockStyle } from './style-DwvipGPs.js';
import { File } from '@babel/types';

type ConditionOperator = "is set" | "is empty" | "equals" | "does not equal" | "greater than" | "less than" | "contains";
interface RepeatQueryData {
    filter?: Record<string, unknown> | null;
    sort?: string | null;
    limit?: number;
    filterVariant?: string | null;
}
interface RepeatData {
    collection?: string | null;
    relation?: string | null;
    query?: RepeatQueryData | null;
    empty?: JsonNode[];
}
interface ConditionRuleData {
    field: string;
    operator: ConditionOperator;
    value?: string | number | boolean | null;
}
interface ConditionData {
    all?: ConditionRuleData[] | null;
    any?: ConditionRuleData[] | null;
}

/**
 * The kind of value a JSX prop carries. We distinguish a *string/number/bool literal*
 * from an *arbitrary expression* because a prop panel (ticket 09) can edit literals
 * inline but must treat expressions as opaque code (`{...}` — round-tripped verbatim).
 */
type PropKind = 'string' | 'number' | 'boolean' | 'expression' | 'boolean-shorthand' | 'field' | 'prop';
interface BlockProp {
    /** Attribute name, e.g. `className`, `data-x`, `aria-label`, `style`. */
    name: string;
    kind: PropKind;
    /**
     * The decoded literal value for `string` / `number` / `boolean`, or the source text
     * of the expression for `expression`. `boolean-shorthand` (a bare `<X disabled />`)
     * has value `true` and no braces. For `expression` this is best-effort source text
     * for display — the authoritative form is always the AST `node`.
     */
    value: string | number | boolean;
    /** The `JSXAttribute` AST node — the surgical edit target. */
    node: unknown;
}
type BlockChild = BlockNode | TextNode | OpaqueNode;
/**
 * A **dynamic/opaque island** child (ticket 11): a JSX expression child the static lens cannot safely
 * decompose — a `.map(...)` loop, a `{cond && <X/>}` conditional, a ternary, an imported-expression
 * call, a bare identifier, or a `{...spread}` child. It is NOT structurally editable; instead the lens
 * captures its **verbatim source text** so the file always round-trips: the canvas renders it as a
 * sealed block (position/delete only) and its {@link JsonOpaque} mirror carries it through unchanged.
 *
 * The `node` handle is the backing `JSXExpressionContainer` / `JSXSpreadChild` — the addressable AST
 * subtree recast reprints byte-for-byte on serialization. `source` is that same subtree printed for
 * display / for the JSON mirror to carry verbatim.
 */
interface OpaqueNode {
    type: 'opaque';
    /**
     * The reason this subtree is opaque — the flavor of dynamic control flow detected. Purely
     * descriptive (drives the canvas label); the source is always carried verbatim regardless.
     */
    reason: 'map' | 'conditional' | 'ternary' | 'expression' | 'spread';
    /** The verbatim source text of the expression (recast-printed from `node`). */
    source: string;
    /** The `JSXExpressionContainer` / `JSXSpreadChild` AST node backing this island. */
    node: unknown;
}
interface TextNode {
    prop?: string;
    field?: string;
    type: 'text';
    /** The literal text (JSXText value, or the string of a `{"..."}` expression). */
    value: string;
    /**
     * The AST node backing this text — a `JSXText`, or the `StringLiteral` /
     * `TemplateLiteral` inside a `JSXExpressionContainer`. This is the addressable
     * handle the ProseMirror rich-text leaf (ticket 10) patches.
     */
    node: unknown;
}
interface BlockNode {
    slots?: Record<string, BlockChild[]>;
    repeat?: RepeatData;
    when?: ConditionData;
    style?: BlockStyle;
    type: 'block';
    /** JSX element/component name, e.g. `div`, `Card`, `Foo.Bar`. `null` for fragments. */
    name: string | null;
    /** Lowercase-initial ⇒ intrinsic host element; else a component reference. */
    isComponent: boolean;
    props: BlockProp[];
    children: BlockChild[];
    /**
     * True when this subtree contains dynamic control flow the static lens does not model
     * (a `.map(...)`, a conditional `&&`/ternary rendering JSX, a spread child, etc), OR a
     * spread ATTRIBUTE (`<X {...props} />`). Ticket 11: the dynamic *children* are captured as
     * {@link OpaqueNode} entries in `children` (preserved verbatim, sealed in the canvas); this
     * flag additionally marks a block whose OPENING TAG carries a spread the lens can't decompose.
     */
    dynamic: boolean;
    /** The `JSXElement` / `JSXFragment` AST node. */
    node: unknown;
}
interface TsxTree {
    /** The recast `File` AST — the source of truth. Pass to `print` to serialize. */
    ast: File;
    /**
     * The top-level blocks discovered in the file (the JSX returned/rendered by each
     * component). A file with no JSX yields an empty array but still round-trips.
     */
    roots: BlockNode[];
}

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
    slots?: Record<string, JsonNode[]>;
    repeat?: RepeatData;
    when?: ConditionData;
    id?: string;
    style?: BlockStyle;
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
    prop?: string;
    field?: string;
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
/** Project a TsxTree, a single BlockNode, or a BlockChild[] into the AST-free JSON tree. */
declare function toJson(input: TsxTree | BlockNode | BlockChild[]): JsonDoc;
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
/** Immutably replace a node (including one inside a named slot). */
declare function updateAt(doc: JsonDoc, path: string, fn: (node: JsonNode) => JsonNode): JsonDoc;
/** Insert `node` as `parentPath`'s child at `index`. `parentPath === ''` targets the doc root array. */
declare function insertInto(doc: JsonDoc, parentPath: string, index: number, node: JsonNode): JsonDoc;
/** Remove the node at `path`. Returns a new doc. */
declare function removeAt(doc: JsonDoc, path: string): JsonDoc;
/**
 * Duplicate as the next sibling, giving every copied block a fresh identity.
 * No-op (returns `doc` unchanged) if `path` does not resolve.
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

export { setProp as A, type BlockNode as B, setText as C, styleRows as D, updateAt as E, type JsonDoc as J, type OpaqueNode as O, type PropKind as P, type StyleRow as S, type TextNode as T, VOID_TAGS as V, type BlockProp as a, type TsxTree as b, type BlockChild as c, type JsonBlock as d, type JsonNode as e, type JsonOpaque as f, type JsonProp as g, type JsonText as h, duplicateAt as i, jsonToTsx as j, getAt as k, indexOf as l, insertInto as m, isJsonBlock as n, isJsonOpaque as o, isJsonText as p, isLeafText as q, joinStyle as r, moveAfter as s, toJson as t, moveBefore as u, parentOf as v, parseStyle as w, propValue as x, removeAt as y, removeProp as z };
