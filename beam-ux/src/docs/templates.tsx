import { Prose } from '../site/Prose.js';
import type { ChromeProps } from './types.js';

/**
 * The two shipped templates — ADR-0213 §1's CSS hack, promoted to data.
 *
 * Every one of the five host copies of `site/entry.tsx` framed its body with the same className list:
 * a reading measure applied PER CHILD (`[&>*]:max-w-3xl`) plus a `data-beam-full-bleed` per-child
 * opt-out so the API reference could span the viewport. That is a template selection — same layout,
 * different fill — written as a stylesheet because there was nowhere to put it. Now there is: an entry
 * declares `template: SpreadTemplate` and the class list stops being a decision each host re-derives.
 *
 * Both keep `<Prose>` (the typographic SCALE, every value a `--beam-*` token with a plain fallback)
 * and neither names a colour or a font. The measure is a *dimension*, not a look, which is why it may
 * live here while the palette may not (§2 invariant i).
 */

/** The per-child measure the prose column reads at, and the full-bleed escape hatch inside it. */
const PROSE_FRAME = [
    'beam-entry w-full',
    '[&>*]:mx-auto [&>*]:w-full [&>*]:max-w-3xl [&>*]:px-6',
    '[&>[data-beam-full-bleed]]:max-w-none [&>[data-beam-full-bleed]]:px-0',
    // Vertical rhythm on the prose column only — a full-bleed child owns its own edges.
    '[&>*:first-child]:pt-12 [&>*:last-child]:pb-16',
    '[&>[data-beam-full-bleed]:first-child]:pt-0 [&>[data-beam-full-bleed]:last-child]:pb-0',
].join(' ');

/**
 * A guide: a readable column, with any child that marks itself `data-beam-full-bleed` allowed out of
 * it. The default for a `page` entry that declares no template, because it is what all five host
 * copies did.
 */
export function ProseTemplate({ children, classNames }: ChromeProps) {
    return <Prose className={[PROSE_FRAME, classNames?.template].filter(Boolean).join(' ')}>{children}</Prose>;
}

/**
 * A whole application rather than an article — the API reference, a dashboard, an editor. No measure,
 * no page padding, and the scale still applies so any prose inside it is legible.
 *
 * `data-beam-full-bleed` is stamped on the wrapper rather than left to the body, so an entry that
 * declares this template gets the full viewport whether or not whoever authored its body remembered
 * the attribute. The attribute survives because a `ProseTemplate` page may still contain one
 * full-bleed child, and that case is what the attribute is for.
 */
export function SpreadTemplate({ children, classNames }: ChromeProps) {
    return (
        <div data-beam-full-bleed="">
            <Prose className={['beam-entry w-full', classNames?.template].filter(Boolean).join(' ')}>
                {children}
            </Prose>
        </div>
    );
}
