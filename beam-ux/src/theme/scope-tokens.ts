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
  --beam-font-sans: var(--theme-docs-font-sans, inherit);
  --beam-font-mono: var(--theme-docs-font-mono, ui-monospace, monospace);
  font-family: var(--beam-font-sans, inherit);
}
.beam-docs :is(code, pre, kbd, samp) {
  font-family: var(--beam-font-mono, ui-monospace, monospace);
}
`;

export function scopeTokensToDocs(css: string): string {
    const scoped = css.replace(
        /^(:root,\s*\n\.dark|:root|\.dark)\s*\{([^}]+)\}/gm,
        (_rule, selector: string, body: string) => {
            const dark = selector === '.dark';
            const scope =
                selector === ':root'
                    ? '.beam-docs'
                    : dark
                    ? '.dark .beam-docs,\n.beam-docs.dark'
                    : '.beam-docs,\n.dark .beam-docs,\n.beam-docs.dark';
            const bridged = body.replace(
                /(--beam-([\w-]+))(\s*:\s*)([^;]+);/g,
                (
                    _declaration,
                    property: string,
                    key: string,
                    separator: string,
                    value: string
                ) => {
                    // JSON Schema keys are camelCase (ink03); the existing CSS codec does not add a numeric separator.
                    const token = key.replace(/-(\d)/g, '$1');
                    return `${property}${separator}var(--theme-docs-${
                        dark ? 'dark-' : ''
                    }${token}, ${value.trim()});`;
                }
            );
            return `${scope} {${bridged}}`;
        }
    );

    return `/* Generated from tokens.css by scopeTokensToDocs() (DOCS-13). Do not edit. */\n${scoped}\n${DOCS_TOKEN_HOOKS}`;
}
