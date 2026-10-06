/**
 * The docs-scoped token sheet (docs-walkthrough DM5, DOCS-13; integrator ruling 08:32Z): `tokens.css` with its
 * selectors scoped to `.beam-docs`, so a host whose own brand owns `:root` (www's dark-first marketing, the flagship's
 * --splice palette) gets the ONE --beam-* family, light and dark, inside its docs pages and nowhere else.
 *
 * Inside docs it also resets the host HOOKS (`--beam-fg`, `--beam-border`, ...) onto the family: a host's marketing
 * values for them (www's pale ink for a dark ground) would otherwise reach the guide kit and the reference. Generated at
 * build time from `tokens.css`, so it never drifts from it.
 */
export const DOCS_TOKEN_HOOKS = `.beam-docs {
  --beam-fg: var(--beam-ink);
  --beam-fg-muted: var(--beam-ink-70);
  --beam-heading: var(--beam-ink);
  --beam-accent: var(--beam-green-deep);
  --beam-border: var(--beam-line);
  --beam-surface-2: var(--beam-muted);
}
`;

export function scopeTokensToDocs(css: string): string {
    const scoped = css
        .replace(/^:root,\s*\n\.dark\s*\{/m, '.beam-docs,\n.dark .beam-docs,\n.beam-docs.dark {')
        .replace(/^:root\s*\{/m, '.beam-docs {')
        .replace(/^\.dark\s*\{/m, '.dark .beam-docs,\n.beam-docs.dark {');

    return `/* Generated from tokens.css by scopeTokensToDocs() (DOCS-13). Do not edit. */\n${scoped}\n${DOCS_TOKEN_HOOKS}`;
}
