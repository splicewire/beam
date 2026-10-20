import { T as TextNode, B as BlockNode, a as BlockProp, b as TsxTree, J as JsonDoc } from './json-BGmPsDn-.js';
export { c as BlockChild, d as JsonBlock, e as JsonNode, f as JsonOpaque, g as JsonProp, h as JsonText, O as OpaqueNode, P as PropKind, j as jsonToTsx, t as toJson } from './json-BGmPsDn-.js';
import { File } from '@babel/types';
import './style-DwvipGPs.js';

/** ux-0231 d8–10: identifiers are data only inside a declared component interface. */
interface ComponentDeclaration {
    name: string;
    attrsSchema?: {
        properties?: Record<string, unknown>;
    };
    admitsChildCategories: string[] | null;
    slots?: {
        name: string;
        admitsChildCategories: string[] | null;
    }[];
}
interface LensContext {
    profile?: {
        nodes: ComponentDeclaration[];
    };
    component?: string;
}

/**
 * `patchText` edits an already-parsed TSX text node in a Babel-free module.
 *
 * The rest of the `.tsx` ⟷ TsxTree lens (`lens.ts`) is an AUTHORING/build concern: it value-imports
 * `recast` + `@babel/types` to parse/generate JSX, which are build-time libraries that must never reach
 * the browser render bundle (`@babel/types`' validators reference a bare `process` global and crash the
 * client). But `patchText` only edits an already-parsed AST text node in place — it needs no parser and
 * no builder, just the node's `.type` discriminant and a plain-object `TemplateElement`. Isolating it
 * here keeps text patching independent of parser and builder imports.
 * `lens.ts` re-exports this as part of the public TSX Lens API.
 */

/**
 * Patch a text node's content. For a `JSXText` node the raw value is replaced; for a
 * string/template literal (a `{"..."}` child) the literal's value is replaced. Only this
 * text node's tokens change on reprint.
 *
 * Uses `.type` discriminants (not `@babel/types` guards) and a plain-object `TemplateElement`
 * (not `t.templateElement`) so this stays free of the babel value-runtime.
 */
declare function patchText(text: TextNode, value: string): void;

/** Parse a `.tsx` source string into an editable TsxTree lens. */
declare function parse(tsx: string, context?: LensContext): TsxTree;
/** Serialize a TsxTree (or a raw AST) back to a `.tsx` string. */
declare function print(input: TsxTree | File): string;
/**
 * Patch a prop's value on the AST node this `BlockProp` references. The new value's kind
 * is inferred from its JS type (string ⇒ string literal attr, number ⇒ `{n}`, boolean ⇒
 * `{true}`/`{false}`). Only this attribute's tokens change on reprint.
 */
declare function patchProp(prop: BlockProp, value: string | number | boolean): void;
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
declare function addProp(block: BlockNode, name: string, value: string | number | boolean | {
    expression: string;
}): BlockProp;
/**
 * REMOVE an attribute from a block — the inverse of `addProp` (a prop panel clearing a `className` /
 * `data-*` / `style` back to absent, not to `""`). Splices the `JSXAttribute` out of the opening
 * element and drops the `BlockProp` from the block's `props`. Returns `true` when an attr was removed,
 * `false` when the name wasn't present (idempotent — removing an absent attr is a no-op). Every
 * surviving attr + the children reprint verbatim.
 */
declare function removeProp(block: BlockNode, name: string): boolean;
/**
 * Replace a prop's value with a raw JS *expression* (`style={{…}}`, `n={a + b}`). The
 * expression source is parsed and its AST substituted. Use this from a prop panel's
 * "edit as code" affordance; use `patchProp` for literal edits.
 */
declare function patchPropExpression(prop: BlockProp, exprSrc: string): void;

/**
 * `@splicewire/beam-ux/tsx-lens` — the lossless `.tsx` ⟷ TsxTree lens.
 *
 * A JS substrate that parses a page `.tsx` file into an editable TsxTree tree and
 * serializes it back byte-identically. The parsed recast AST is the source of truth;
 * the TsxTree is an editable lens over it (each block/prop/text holds a live AST node
 * reference). Edits patch nodes; recast reprints untouched nodes from their original
 * tokens. Foundation for file→DB sync, prop panels, the rich-text leaf, opaque islands,
 * and the canvas (beam Model-B tickets 08/09/10/11/16).
 */

/**
 * Re-parse a JSON document back into a Babel-backed TsxTree (build/server side; pulls recast/@babel
 * via {@link parse}). `parse(jsonToTsx(doc))` — the closing leg of the JSON⟷.tsx round-trip. The
 * browser never calls this; it edits the JSON directly and persists it.
 */
declare function fromJson(doc: JsonDoc, context?: LensContext): TsxTree;

export { BlockNode, BlockProp, JsonDoc, type LensContext, TextNode, TsxTree, addProp, fromJson, parse, patchProp, patchPropExpression, patchText, print, removeProp };
