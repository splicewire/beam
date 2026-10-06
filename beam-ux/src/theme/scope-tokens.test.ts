import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { scopeTokensToDocs } from './scope-tokens.js';

/**
 * DOCS-13 (DM5; integrator 08:32Z): a host whose brand owns `:root` imports the docs-scoped sheet. Inside `.beam-docs`
 * every --beam-* key has its light value, and under `.dark` its dark one; nothing reaches `:root`, so marketing pages are
 * untouched; the host hooks are reset onto the family inside docs.
 */
const tokens = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tokens.css'), 'utf8');
const scoped = scopeTokensToDocs(tokens);
const keysOf = (css: string, selectorStart: string) => {
    const at = css.indexOf(selectorStart);
    const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
    return new Set([...body.matchAll(/(--beam-[\w-]+)\s*:/g)].map((m) => m[1]));
};

describe('scopeTokensToDocs', () => {
    it('never touches :root', () => {
        expect(scoped).not.toMatch(/^:root/m);
        expect(scoped).not.toMatch(/^\.dark\s*\{/m);
    });

    it('carries every light and dark key inside .beam-docs', () => {
        const light = keysOf(tokens, ':root {');
        const dark = keysOf(tokens, '.dark {');
        expect(keysOf(scoped, '.beam-docs {')).toEqual(light);
        expect(keysOf(scoped, '.dark .beam-docs,')).toEqual(dark);
    });

    it('resets the host hooks onto the family inside docs', () => {
        expect(scoped).toContain('--beam-fg: var(--beam-ink);');
        expect(scoped).toContain('--beam-border: var(--beam-line);');
        // Normal-size prose links must clear WCAG AA on the docs paper. `--beam-green` measures 4.40:1 in light;
        // the scheme-specific deep token clears 4.5:1 and also reaches link-wrapped inline code on its tinted fill.
        expect(scoped).toContain('--beam-accent: var(--beam-green-deep);');
    });
});
