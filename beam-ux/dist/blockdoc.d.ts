import { JsonDoc } from './blockdoc/json.js';
export { JsonBlock, JsonNode, JsonOpaque, JsonProp, JsonText, jsonToTsx, toJson } from './blockdoc/json.js';
import { T as TextNode, B as BlockNode, a as BlockProp, b as BlockDoc } from './types-K1Eu-Q2o.js';
export { c as BlockChild, O as OpaqueNode, P as PropKind } from './types-K1Eu-Q2o.js';
import { File } from '@babel/types';

/**
 * `patchText` — the ONE lens edit-op the inline leaf seam (`@splicewire/beam-ux/leaf`) needs, kept in a
 * **babel-free** module on purpose.
 *
 * The rest of the `.tsx` ⟷ BlockDoc lens (`lens.ts`) is an AUTHORING/build concern: it value-imports
 * `recast` + `@babel/types` to parse/generate JSX, which are build-time libraries that must never reach
 * the browser render bundle (`@babel/types`' validators reference a bare `process` global and crash the
 * client). But `patchText` only edits an already-parsed AST text node in place — it needs no parser and
 * no builder, just the node's `.type` discriminant and a plain-object `TemplateElement`. Isolating it
 * here lets `leaf/bind.ts` import a lossless text patch WITHOUT dragging babel/recast onto the client
 * render path. `lens.ts` re-exports this so the public lens API is unchanged.
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

/**
 * BlockDoc lens core — lossless `.tsx` ⟷ BlockDoc.
 *
 * `parse` builds the lens over a recast AST; `print` serializes the (possibly patched)
 * AST back. Untouched nodes reprint from their original tokens, so an unedited
 * parse→print is byte-identical, and any single edit is surgical (only the target node's
 * tokens change) and idempotent.
 */

/** Parse a `.tsx` source string into an editable BlockDoc lens. */
declare function parse(tsx: string): BlockDoc;
/** Serialize a BlockDoc (or a raw AST) back to a `.tsx` string. */
declare function print(input: BlockDoc | File): string;
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
 * `@splicewire/beam-ux/blockdoc` — the lossless `.tsx` ⟷ BlockDoc lens.
 *
 * A JS substrate that parses a page `.tsx` file into an editable BlockDoc tree and
 * serializes it back byte-identically. The parsed recast AST is the source of truth;
 * the BlockDoc is an editable lens over it (each block/prop/text holds a live AST node
 * reference). Edits patch nodes; recast reprints untouched nodes from their original
 * tokens. Foundation for file→DB sync, prop panels, the rich-text leaf, opaque islands,
 * and the canvas (beam Model-B tickets 08/09/10/11/16).
 */

/**
 * Re-parse a JSON document back into a Babel-backed BlockDoc (build/server side; pulls recast/@babel
 * via {@link parse}). `parse(jsonToTsx(doc))` — the closing leg of the JSON⟷.tsx round-trip. The
 * browser never calls this; it edits the JSON directly and persists it.
 */
declare function fromJson(doc: JsonDoc): BlockDoc;

export { BlockDoc, BlockNode, BlockProp, JsonDoc, TextNode, addProp, fromJson, parse, patchProp, patchPropExpression, patchText, print, removeProp };
