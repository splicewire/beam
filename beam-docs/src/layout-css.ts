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

/* A SpreadTemplate entry is a whole application rather than an article (the API reference, the MCP
   catalogue) and brings its own sidebar and search, so the layout gives it the viewport instead of a
   main column between the rail and the on-this-page column. \`data-beam-full-bleed\` only escapes the
   reading measure; without this, Scalar rendered into ~41rem on every host but the flagship, which
   carried the rule itself (beam-docs-satellite ticket 54 §3). */
.beam-docs:has(.beam-tpl-spread) .beam-docs-body {
  max-width: none;
  padding-inline: 0;
  padding-block: 0;
  gap: 0;
}
.beam-docs:has(.beam-tpl-spread) .beam-docs-rail,
.beam-docs:has(.beam-tpl-spread) .beam-docs-aside { display: none; }
`;
