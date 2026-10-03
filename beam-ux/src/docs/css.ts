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
/* The child box IS the text column: the gutter comes off its width rather than going on as padding-inline, because a
   prose block's own padding (a list's indent, a code block's or blockquote's inset) is more specific and would replace
   it, leaving list markers, the quote bar and the code block outside the column (launch ticket 05 item 6). Paragraphs
   and headings sit exactly where they did. Scoped with the Prose root's attribute so it outranks a prose element rule
   that sets its own width (Prose's table rule, width 100%), which would otherwise fill the template, not the column. */
.beam-tpl-prose[data-beam-prose] > * {
  margin-inline: auto;
  width: calc(100% - 2 * var(--beam-gutter, 1.5rem));
  max-width: calc(var(--beam-measure, 48rem) - 2 * var(--beam-gutter, 1.5rem));
}
/* A full-bleed child is a whole application rather than an article — it owns its own edges. */
.beam-tpl-prose > [data-beam-full-bleed] {
  max-width: none;
  width: 100%;
}
.beam-tpl-prose > *:first-child { padding-block-start: var(--beam-page-top, 3rem); }
.beam-tpl-prose > *:last-child { padding-block-end: var(--beam-page-bottom, 4rem); }
.beam-tpl-prose > [data-beam-full-bleed]:first-child { padding-block-start: 0; }
.beam-tpl-prose > [data-beam-full-bleed]:last-child { padding-block-end: 0; }

.beam-tpl-spread { width: 100%; }
`;
