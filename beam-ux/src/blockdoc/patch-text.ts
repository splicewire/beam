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
