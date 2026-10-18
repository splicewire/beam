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

import type { TextNode } from './types.js';

/**
 * Patch a text node's content. For a `JSXText` node the raw value is replaced; for a
 * string/template literal (a `{"..."}` child) the literal's value is replaced. Only this
 * text node's tokens change on reprint.
 *
 * Uses `.type` discriminants (not `@babel/types` guards) and a plain-object `TemplateElement`
 * (not `t.templateElement`) so this stays free of the babel value-runtime.
 */
export function patchText(text: TextNode, value: string): void {
    const node = text.node as { type?: string; value?: unknown; extra?: unknown } & Record<
        string,
        unknown
    >;

    if (node.type === 'JSXText') {
        node.value = value;
        // recast reprints from `value`; clear the cached raw extra so it re-emits.
        node.extra = undefined;
    } else if (node.type === 'StringLiteral') {
        node.value = value;
        node.extra = undefined;
    } else if (node.type === 'TemplateLiteral') {
        // Collapse the template to a single cooked/raw quasi so the new text round-trips. A plain
        // object matches what `t.templateElement({ raw, cooked }, true)` produces, without babel.
        node.expressions = [];
        node.quasis = [
            { type: 'TemplateElement', value: { raw: value, cooked: value }, tail: true },
        ];
    }
    text.value = value;
}
