// @splicewire/beam-ux/site — the typographic scale a rendered entry body reads at.
//
// ## Why the package ships this at all
//
// A beam host renders entry bodies through its own page component, and until now the package
// contributed nothing to how they LOOKED — so a correctly seeded, published, compiled docs page arrived
// with headings and body copy at the same weight (beam-docs-satellite ticket 07, on `splicewire/www`).
// That is a broken out-of-the-box story: a fresh `laravel-beam-starter` is supposed to self-document on
// first boot, and prose nobody can skim does not document anything. Every host solving it privately
// would be the same duplication `SiteLayout` exists to prevent.
//
// ## Why it is a string and a component, not a stylesheet
//
// `@splicewire/beam-ux` ships no CSS files and is `sideEffects: false`, so a `.css` import is exactly
// the kind of thing a bundler is entitled to drop. `ApiReference` already set the convention for this
// package — CSS as a **string** the component injects — and this follows it, which also means no change
// to `files`, no import order to get wrong, and nothing for a host's build to be configured for.
//
// ## Theme-neutral by the same contract as the rest of /site
//
// Every value below is a `--beam-*` custom property with a plain fallback. The package chooses the
// SCALE (relative sizes, rhythm, measure, code treatment); the host chooses the palette and the fonts,
// exactly as it does for `SiteLayout` and `ApiReference`. Nothing here names a colour that isn't a
// token, so a beam site that is not Splicewire cannot inherit Splicewire's look.
//
// Overriding, in increasing order of force: redefine the tokens on any ancestor; pass `className` to add
// your own rules after these; or pass `css` to replace the stylesheet outright. A host that wants none
// of it simply does not render `<Prose>`.
import { type CSSProperties, type ReactNode, useId } from 'react';

/**
 * The default rules, exported so a host can extend rather than replace — `css={PROSE_CSS + extra}`.
 *
 * Scoped to an attribute selector rather than a class name so the rules cannot collide with a host's
 * own `.prose` (Tailwind Typography's, most likely) and so the two can coexist on one page.
 */
export const PROSE_CSS = `
[data-beam-prose] {
  color: var(--beam-fg, inherit);
  font-family: var(--beam-font-sans, inherit);
  font-size: var(--beam-prose-size, 1rem);
  line-height: var(--beam-prose-leading, 1.7);
}

/* Rhythm: space comes from the element ABOVE, so the first child never pushes the block down. */
[data-beam-prose] > * { margin-block: 0; }
[data-beam-prose] > * + * { margin-block-start: var(--beam-prose-gap, 1.25em); }

[data-beam-prose] h1,
[data-beam-prose] h2,
[data-beam-prose] h3,
[data-beam-prose] h4 {
  color: var(--beam-heading, var(--beam-fg, inherit));
  font-family: var(--beam-font-display, var(--beam-font-sans, inherit));
  font-weight: var(--beam-heading-weight, 600);
  line-height: 1.25;
  text-wrap: balance;
}

[data-beam-prose] > h1 { font-size: 2.25em; }
[data-beam-prose] > h2 { font-size: 1.5em; }
[data-beam-prose] > h3 { font-size: 1.25em; }
[data-beam-prose] > h4 { font-size: 1.05em; }

/* A heading belongs to what follows it, so it gets more space above than below. */
[data-beam-prose] > * + :is(h1, h2, h3, h4) { margin-block-start: var(--beam-prose-heading-gap, 2em); }
[data-beam-prose] > :is(h1, h2, h3, h4) + * { margin-block-start: var(--beam-prose-gap, 0.75em); }

[data-beam-prose] a {
  color: var(--beam-accent, currentColor);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

[data-beam-prose] strong { color: var(--beam-heading, var(--beam-fg, inherit)); font-weight: 650; }

[data-beam-prose] :is(ul, ol) { padding-inline-start: 1.5em; }
[data-beam-prose] ul { list-style: disc; }
[data-beam-prose] ol { list-style: decimal; }
[data-beam-prose] li + li { margin-block-start: 0.4em; }
[data-beam-prose] li::marker { color: var(--beam-muted, currentColor); }

[data-beam-prose] :not(pre) > code {
  background: var(--beam-surface-2, color-mix(in srgb, currentColor 8%, transparent));
  border-radius: 0.3em;
  font-family: var(--beam-font-mono, ui-monospace, monospace);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
}

[data-beam-prose] pre {
  background: var(--beam-surface-2, color-mix(in srgb, currentColor 8%, transparent));
  border: 1px solid var(--beam-border, transparent);
  border-radius: var(--beam-radius, 0.5rem);
  font-family: var(--beam-font-mono, ui-monospace, monospace);
  font-size: 0.875em;
  line-height: 1.6;
  overflow-x: auto;
  padding: 1em 1.15em;
}
[data-beam-prose] pre code { background: none; font-size: inherit; padding: 0; }

[data-beam-prose] blockquote {
  border-inline-start: 2px solid var(--beam-accent, currentColor);
  color: var(--beam-muted, inherit);
  padding-inline-start: 1em;
}

[data-beam-prose] hr { border: 0; border-block-start: 1px solid var(--beam-border, currentColor); opacity: 0.6; }

/* Tables scroll inside their own box rather than widening the page. */
[data-beam-prose] table { border-collapse: collapse; display: block; overflow-x: auto; width: 100%; }
[data-beam-prose] :is(th, td) {
  border-block-end: 1px solid var(--beam-border, currentColor);
  padding: 0.5em 0.75em;
  text-align: start;
}
[data-beam-prose] th { color: var(--beam-heading, var(--beam-fg, inherit)); font-weight: 600; }

[data-beam-prose] :is(img, video) { border-radius: var(--beam-radius, 0.5rem); height: auto; max-width: 100%; }

/* A full-bleed child (an embedded reference surface) opts out of the measure entirely. */
[data-beam-prose] > [data-beam-full-bleed] { margin-inline: 0; max-width: none; }
`;

export type ProseProps = {
    /** The rendered body. */
    children: ReactNode;
    /** Replace the stylesheet outright. Defaults to {@link PROSE_CSS}; `''` opts out of styling. */
    css?: string;
    /** Extra classes, applied after the defaults so a host layer wins. */
    className?: string;
    style?: CSSProperties;
    /** Rendered element. `article` by default — an entry body is a document. */
    as?: 'article' | 'div' | 'section' | 'main';
};

/**
 * Wrap a rendered entry body in beam's typographic scale.
 *
 * The `<style>` is emitted inline rather than registered globally, which keeps the component usable in
 * SSR, in a test renderer, and more than once on a page without ordering surprises — browsers dedupe
 * identical rules, and the cost is a few hundred bytes against a body that is already an HTTP round
 * trip. `useId` keeps React from complaining about repeated keys when several bodies render at once.
 */
export function Prose({ children, css = PROSE_CSS, className, style, as: Tag = 'article' }: ProseProps) {
    const id = useId();

    return (
        <Tag data-beam-prose="" data-prose-id={id} className={className} style={style}>
            {css === '' ? null : <style>{css}</style>}
            {children}
        </Tag>
    );
}
