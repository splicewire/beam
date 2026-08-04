/**
 * BlockDoc lens — the editable projection over a parsed `.tsx` page AST.
 *
 * The AST (recast + @babel/parser) is the source of truth. A BlockDoc is a *lens*:
 * every node in it holds a live reference (`node`) to the babel AST node it projects,
 * so an edit patches the AST node's tokens and recast reprints only that node — every
 * untouched node is reprinted from its original source tokens (byte-identical).
 *
 * Consumers (tickets 08/09/10/11/16) read the lens for structure + props, then call the
 * edit ops (patchProp / patchText) which mutate the underlying AST in place. Re-`print`
 * the same AST to serialize.
 */

import type { File } from '@babel/types';

/**
 * The kind of value a JSX prop carries. We distinguish a *string/number/bool literal*
 * from an *arbitrary expression* because a prop panel (ticket 09) can edit literals
 * inline but must treat expressions as opaque code (`{...}` — round-tripped verbatim).
 */
export type PropKind = 'string' | 'number' | 'boolean' | 'expression' | 'boolean-shorthand';

export interface BlockProp {
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

export type BlockChild = BlockNode | TextNode | OpaqueNode;

/**
 * A **dynamic/opaque island** child (ticket 11): a JSX expression child the static lens cannot safely
 * decompose — a `.map(...)` loop, a `{cond && <X/>}` conditional, a ternary, an imported-expression
 * call, a bare identifier, or a `{...spread}` child. It is NOT structurally editable; instead the lens
 * captures its **verbatim source text** so the file always round-trips: the canvas renders it as a
 * sealed block (position/delete only) and the bridge preserves it as an `OpaqueIsland` Puck node.
 *
 * The `node` handle is the backing `JSXExpressionContainer` / `JSXSpreadChild` — the addressable AST
 * subtree recast reprints byte-for-byte on serialization. `source` is that same subtree printed for
 * display / for the bridge to carry through Puck Data.
 */
export interface OpaqueNode {
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

export interface TextNode {
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

export interface BlockNode {
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

export interface BlockDoc {
    /** The recast `File` AST — the source of truth. Pass to `print` to serialize. */
    ast: File;
    /**
     * The top-level blocks discovered in the file (the JSX returned/rendered by each
     * component). A file with no JSX yields an empty array but still round-trips.
     */
    roots: BlockNode[];
}
