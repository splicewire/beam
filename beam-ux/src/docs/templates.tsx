import { Prose } from '../site/Prose.js';
import { DOCS_TEMPLATE_CSS } from './css.js';
import type { ChromeProps } from './types.js';

/**
 * The two shipped templates — ADR-0213 §1's CSS hack, promoted to data.
 *
 * Every one of the five host copies of `site/entry.tsx` framed its body with the same rules: a reading
 * measure applied PER CHILD plus a `data-beam-full-bleed` per-child opt-out so the API reference could
 * span the viewport. That is a template selection — same layout, different fill — written as a
 * stylesheet because there was nowhere to put it. Now there is: an entry declares
 * `template: SpreadTemplate` and the rules stop being a decision each host re-derives.
 *
 * Both keep `<Prose>` (the typographic SCALE, every value a `--beam-*` token with a plain fallback)
 * and neither names a colour or a font. The measure is a *dimension*, not a look, which is why it may
 * live here while the palette may not (ADR-0213 §2 invariant i). See `css.ts` for why the rules are an
 * injected string rather than Tailwind utilities — the short version is that a host's Tailwind does not
 * scan `node_modules`, so a utility class shipped in a package's bundle has no rule behind it.
 */

/**
 * A guide: a readable column, with any child that marks itself `data-beam-full-bleed` allowed out of
 * it. The default for a `page` entry that declares no template, because it is what all five host
 * copies did.
 */
export function ProseTemplate({ children, classNames }: ChromeProps) {
    return (
        <>
            <style>{DOCS_TEMPLATE_CSS}</style>
            <Prose className={['beam-entry beam-tpl-prose', classNames?.template].filter(Boolean).join(' ')}>
                {children}
            </Prose>
        </>
    );
}

/**
 * A whole application rather than an article — the API reference, a dashboard, an editor. No measure,
 * no page padding, and the scale still applies so any prose inside it is legible.
 *
 * `data-beam-full-bleed` is stamped on the wrapper rather than left to the body, so an entry that
 * declares this template gets the full viewport whether or not whoever authored its body remembered
 * the attribute. The attribute survives on children too, because a `ProseTemplate` page may still
 * contain one full-bleed child and that case is what it is for.
 */
export function SpreadTemplate({ children, classNames }: ChromeProps) {
    return (
        <div data-beam-full-bleed="">
            <style>{DOCS_TEMPLATE_CSS}</style>
            <Prose className={['beam-entry beam-tpl-spread', classNames?.template].filter(Boolean).join(' ')}>
                {children}
            </Prose>
        </div>
    );
}
