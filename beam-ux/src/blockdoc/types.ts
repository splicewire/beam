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

export type BlockChild = BlockNode | TextNode;

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
     * (a `.map(...)`, a conditional `&&`/ternary rendering JSX, a spread child, etc).
     * Ticket 11 renders these as opaque islands — edit the AST directly, never via the lens.
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
