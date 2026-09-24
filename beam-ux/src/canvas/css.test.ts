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

// A version label is generated and can be long ("v272-restore-of-v270-published"). It was ellipsized in the 320px versions
// panel, which cut off the part that says what it restored (ux-demo screenshot review, replay 5). It wraps instead.
describe('the versions panel shows a whole version label', () => {
    const rule = (peCss(theme).match(/\.pe-version-label\{([^}]*)\}/) ?? [])[1] ?? '';

    it('wraps a long label rather than ellipsizing it', () => {
        expect(rule).not.toContain('text-overflow:ellipsis');
        expect(rule).not.toContain('white-space:nowrap');
        expect(rule).toContain('overflow-wrap:anywhere');
        expect(rule).toContain('min-width:0');
    });
});

// The readable ref is generated too, and can be the long part ("v279-restore-of-v277-published"). As a
// sibling of the label it kept its full width and squeezed the label into a one-character strip beside the
// Restore button (replay-6 G2-BEAM-DRAFT-PUBLISH). Ref and label now stack in one shrinkable text column,
// both wrap, and the status tag and Restore button never shrink.
describe('the versions panel keeps a long ref from crushing the row', () => {
    const css = peCss(theme);
    const ruleOf = (selector: string): string =>
        (css.match(new RegExp(`${selector.replace(/[.>]/g, '\\$&')}\\{([^}]*)\\}`)) ?? [])[1] ?? '';

    it('stacks ref and label in one shrinkable column', () => {
        const text = ruleOf('.pe-version-text');
        expect(text).toContain('min-width:0');
        expect(text).toContain('flex-direction:column');
    });

    it('lets the ref wrap instead of holding its full width', () => {
        const ref = ruleOf('.pe-version-ref');
        expect(ref).toContain('min-width:0');
        expect(ref).toContain('overflow-wrap:anywhere');
    });

    it('keeps the status tag and Restore button at their own width', () => {
        expect(ruleOf('.pe-version-tag')).toContain('flex:none');
        expect(ruleOf('.pe-version>.pe-btn')).toContain('flex:none');
    });
});
