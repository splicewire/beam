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

/* The packaged header (DOCS-12, DM4). Structure only; colours come from the defined --beam-* tokens or the host hooks,
   so DOCS-13's theme values reach it without a second rule. It wraps rather than scrolls at 390px (DOC-8). */
.beam-docs-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--beam-docs-header-gap, 0.75rem 1.5rem);
  padding: var(--beam-docs-header-pad, 0.75rem var(--beam-gutter, 1.5rem));
  border-bottom: 1px solid var(--beam-border, var(--beam-line));
}
.beam-docs-brand { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; text-decoration: none; color: inherit; }
.beam-docs-brand img { height: 1.375rem; width: auto; }
.beam-docs-surfaces { display: flex; flex-wrap: wrap; gap: 1rem; }
.beam-docs-surfaces a { text-decoration: none; color: inherit; opacity: 0.75; }
.beam-docs-surfaces a[aria-current='page'] { opacity: 1; font-weight: 600; }
.beam-docs-header-end { margin-left: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.beam-docs-back { text-decoration: none; color: inherit; opacity: 0.75; white-space: nowrap; }
.beam-docs-drawer-toggle { display: none; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; }

/* The product switcher (DOC-16): a panel under its trigger, above the page. */
.beam-docs-switcher { position: relative; }
.beam-docs-switcher > button { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.75rem; cursor: pointer; }
.beam-docs-switcher-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 30;
  width: min(18rem, calc(100vw - 2rem));
  padding: 0.75rem;
  border: 1px solid var(--beam-border, var(--beam-line));
  border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, Canvas);
}
.beam-docs-switcher-item { display: flex; flex-direction: column; gap: 0.25rem; }
.beam-docs-switcher-item p { margin: 0; opacity: 0.75; }

/* Under 60rem the rail is a drawer the header's menu button opens (DOC-8), not a vanished column. */
@media (max-width: 60rem) {
  .beam-docs-drawer-toggle { display: inline-flex; }
  .beam-docs[data-drawer-open] .beam-docs-rail {
    display: block;
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 40;
    width: min(20rem, 85vw);
    overflow-y: auto;
    padding: 1rem;
    background: var(--beam-paper, Canvas);
    border-right: 1px solid var(--beam-border, var(--beam-line));
  }
}

/* The packaged search box (DOCS-14): a field in the header and a results panel under it. Colours are tokens. */
.beam-docs-search { position: relative; }
.beam-docs-search input {
  width: min(16rem, 60vw);
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--beam-border, var(--beam-line));
  border-radius: var(--beam-radius, 0.5rem);
  background: transparent;
  color: inherit;
  font: inherit;
}
.beam-docs-search-results {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 30;
  width: min(26rem, calc(100vw - 2rem));
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--beam-border, var(--beam-line));
  border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, Canvas);
}
.beam-docs-search-results a { display: block; padding: 0.5rem; text-decoration: none; color: inherit; border-radius: var(--beam-radius, 0.5rem); }
.beam-docs-search-results a small { display: block; opacity: 0.65; }
.beam-docs-search-results a p { margin: 0.25rem 0 0; opacity: 0.75; }

/* DOCS-13 (DM5): the docs read ONE token family. The rail, header and body take their ink from --beam-* (which flips
   under .dark), never a host's dark-rail --sidebar-* ink, which drew the invisible rail of shots 23/35. */
.beam-docs { color: var(--beam-fg, var(--beam-ink)); background: var(--beam-paper); }
/* --beam-ink-70, not --beam-ink-muted: 5.87:1 on --beam-paper in light and 7.69:1 in dark (ink-muted is 3.19 in light),
   so rail links clear DOC-8's 4.5:1 in both schemes; no host hook sits in front of it. */
.beam-docs-rail a { color: var(--beam-ink-70); }
.beam-docs-rail a:hover { color: var(--beam-fg, var(--beam-ink)); }
.beam-docs-rail a[aria-current='page'], .beam-docs-rail a[data-active='true'] { color: var(--beam-fg, var(--beam-ink)); font-weight: 600; }
.beam-docs-appearance { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.5rem; cursor: pointer; }
`;
