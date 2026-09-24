import { describe, expect, it } from 'vitest';
import { peCss, veCss } from './css.js';

// The inspector's fields (schemastud/frame's shadcn inputs, tabs and group headings, plus the chip and
// style-row widgets) colour themselves from the host's shadcn variables. A host's light theme defines
// `--foreground` as near-black, so inside the dark editor panel every property name and value rendered
// dark-on-dark (ux-demo screenshot review 2026-09-24, G2-BEAM-AUTHOR-ENTRY and G2-BEAM-DRAFT-PUBLISH).
// The canvas owns its panel palette, so it must re-point those variables inside the inspector region,
// both the bare tokens and Tailwind's `--color-*` aliases, which a host's `@theme` resolves at :root.

const theme = { panelBg: '#0f172a', panelFg: '#e2e8f0', muted: '#64748b', accent: '#0f172a' };

const inspectorRule = (css: string): string => {
    const match = css.match(/\[data-frame-region="inspector"\]\{([^}]*--foreground[^}]*)\}/);
    return match?.[1] ?? '';
};

describe.each([
    ['peCss', peCss],
    ['veCss', veCss],
])('%s scopes the inspector to the panel palette', (_name, css) => {
    const rule = inspectorRule(css(theme));

    it('points foreground text at the panel foreground', () => {
        expect(rule).toContain('--foreground:#e2e8f0');
        expect(rule).toContain('--color-foreground:#e2e8f0');
        expect(rule).toContain('color:#e2e8f0');
    });

    it('points muted text at the panel muted colour', () => {
        expect(rule).toContain('--muted-foreground:#64748b');
        expect(rule).toContain('--color-muted-foreground:#64748b');
    });

    it('gives field surfaces the panel background', () => {
        expect(rule).toContain('--background:#0f172a');
        expect(rule).toContain('--color-background:#0f172a');
    });
});
