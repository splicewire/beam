/**
 * The structural CSS the `/docs` chrome injects, as a **string**.
 *
 * ## Why not Tailwind utility classes
 *
 * The first cut of these components carried the class list the five host copies of `site/entry.tsx`
 * used verbatim — `[&>*]:mx-auto [&>*]:max-w-3xl [&>*]:px-6` and friends. It rendered edge-to-edge on
 * the first host that tried it, and the reason is structural rather than a typo: a host's Tailwind
 * scans the host's own sources, not `node_modules/@splicewire/beam-ux/dist`, so a utility that exists
 * only inside a package's bundle is a class name with no rule behind it. Lifting a component into a
 * package therefore silently strips its styling unless the host adds a `@source` line — which is
 * exactly the "a fix written at the host is a fix the next host will need again" shape ticket 26 is
 * about, one layer down.
 *
 * `<Prose>` already settled this for this package: CSS as a string the component injects, because the
 * package ships no `.css` files and is `sideEffects: false`, so a stylesheet import is something a
 * bundler is entitled to drop. These follow it.
 *
 * ## Every value is a token with a plain fallback
 *
 * Same contract as `PROSE_CSS`: the package picks the ARRANGEMENT (a measure, a rail width, a gutter);
 * the host picks what those are by redefining `--beam-*` on any ancestor, and nothing here names a
 * colour or a font. The defaults are the numbers the host copies had hardcoded — `48rem` for
 * Tailwind's `max-w-3xl`, `1.5rem` for `px-6`, `3rem`/`4rem` for `pt-12`/`pb-16` — so the lift changes
 * no pixel on a host that redefines nothing.
 */
export const DOCS_TEMPLATE_CSS = `
.beam-tpl-prose { width: 100%; }
.beam-tpl-prose > * {
  margin-inline: auto;
  width: 100%;
  max-width: var(--beam-measure, 48rem);
  padding-inline: var(--beam-gutter, 1.5rem);
}
/* A full-bleed child is a whole application rather than an article — it owns its own edges. */
.beam-tpl-prose > [data-beam-full-bleed] {
  max-width: none;
  padding-inline: 0;
}
.beam-tpl-prose > *:first-child { padding-block-start: var(--beam-page-top, 3rem); }
.beam-tpl-prose > *:last-child { padding-block-end: var(--beam-page-bottom, 4rem); }
.beam-tpl-prose > [data-beam-full-bleed]:first-child { padding-block-start: 0; }
.beam-tpl-prose > [data-beam-full-bleed]:last-child { padding-block-end: 0; }

.beam-tpl-spread { width: 100%; }
`;

export const DOCS_LAYOUT_CSS = `
.beam-docs { display: flex; min-height: 100vh; flex-direction: column; }
.beam-docs-body {
  margin-inline: auto;
  display: flex;
  width: 100%;
  max-width: var(--beam-docs-width, 80rem);
  flex: 1 1 auto;
  gap: var(--beam-docs-gap, 2.5rem);
  padding-inline: var(--beam-gutter, 1.5rem);
  padding-block: var(--beam-docs-pad, 2.5rem);
}
.beam-docs-rail { width: var(--beam-docs-rail, 14rem); flex: none; }
.beam-docs-main { min-width: 0; flex: 1 1 auto; }
.beam-docs-aside { width: var(--beam-docs-aside, 14rem); flex: none; }

/* The two side columns are the first thing to go on a narrow viewport: a rail and an on-this-page
   column beside a reading measure is three columns in the width of one. The rail's content is still
   reachable — it is the same projection the site nav renders from (ADR-0210 §5, one payload). */
@media (max-width: 80rem) { .beam-docs-aside { display: none; } }
@media (max-width: 60rem) { .beam-docs-rail { display: none; } }
`;
