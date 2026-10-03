import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_CANVAS_THEME, peCss, veCss } from './css.js';

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

describe('peCss floating panels', () => {
    const css = peCss(theme);

    it('keeps the panel opaque: no mask fades the panel background into the page behind it', () => {
        const panel = css.match(/\.pe-panel\{([^}]*)\}/)?.[1] ?? '';
        expect(panel).toContain('background:#0f172a');
        expect(panel).not.toMatch(/mask-image/);
    });

    it('softens an overflowing panel with a sticky content fade into the panel colour', () => {
        const fade = css.match(/\.pe-panel::after\{([^}]*)\}/)?.[1] ?? '';
        expect(fade).toContain('position:sticky');
        expect(fade).toContain('bottom:0');
        expect(fade).toContain('linear-gradient(to bottom,transparent,#0f172a)');
    });
});

// Launch ticket 05 item 4: the editor read as a third product (a blue accent and monospace chrome) beside the app's Beam
// green. Its default palette is the app's own tokens, read here from the shipped tokens.css so the two cannot drift: the
// accent is the app's primary green, the panels are the app's dark rail, and the chrome is set in the body face.
// The values stay hex because the theme editor's colour fields hold `#rrggbb` (format: color).
describe('the default editor chrome takes the app tokens', () => {
    // Read off disk: a `?raw` CSS import is empty under this vitest config.
    const tokens = readFileSync(resolve(import.meta.dirname, '../theme/tokens.css'), 'utf8');
    const light = tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('.dark {'));
    const token = (name: string): string => {
        const value = light.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
        if (!value) throw new Error(`no --${name} in tokens.css`);
        return value.toLowerCase();
    };
    // --beam-rail-fg is an rgba over the rail; the theme needs it as the opaque colour it reads as.
    const over = (rgba: string, bg: string): string => {
        const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number);
        const base = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
        return `#${[r, g, b].map((c, i) => Math.round(c * a + base[i] * (1 - a)).toString(16).padStart(2, '0')).join('')}`;
    };

    it('uses the app palette: primary green, the dark rail, the app ink', () => {
        const t = DEFAULT_CANVAS_THEME;
        expect(t.accent.toLowerCase()).toBe(token('beam-green'));
        expect(t.accentHover.toLowerCase()).toBe(token('beam-green-deep'));
        expect(t.panelBg.toLowerCase()).toBe(token('beam-rail'));
        expect(t.rootBg.toLowerCase()).toBe(token('beam-rail-deep'));
        expect(t.panelFg.toLowerCase()).toBe(token('beam-rail-active'));
        expect(t.muted.toLowerCase()).toBe(over(token('beam-rail-fg'), token('beam-rail')));
        expect(t.ink.toLowerCase()).toBe(token('beam-ink'));
        expect(t.canvas.toLowerCase()).toBe(token('beam-paper-raised'));
    });

    it('sets the chrome in the body face; monospace stays for source and code', () => {
        const css = veCss() + peCss();
        const rule = (selector: string): string => {
            const at = css.indexOf(`${selector}{`);
            if (at === -1) throw new Error(`no ${selector} rule`);
            return css.slice(at, css.indexOf('}', at));
        };
        for (const selector of ['.ve-bar', '.ve-crumbs', '.ve-menu', '.ve-insp-h', '.pe-bar', '.pe-comp-badge', '.pe-versions h3', '.pe-version', '.pe-confirm']) {
            expect(rule(selector), selector).not.toContain(DEFAULT_CANVAS_THEME.fontMono);
        }
        expect(rule('.ve-src pre')).toContain(DEFAULT_CANVAS_THEME.fontMono);
        expect(rule('.ve-opaque-src')).toContain(DEFAULT_CANVAS_THEME.fontMono);
    });
});
