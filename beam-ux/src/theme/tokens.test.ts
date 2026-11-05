import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PROSE_CSS } from '../site/Prose.js';

/**
 * The opt-in token layer (ADR 0002). What it must guarantee is that a host importing it gets EVERY
 * beam-tier colour key the packages read, in both schemes, and nothing that would override a host's
 * site theme. Each case below reads the real shipped file and the real package sources, so adding a
 * `--beam-*` read to a component without a default here fails this suite rather than rendering an
 * unset variable on the first host that did not define it.
 */
const here = dirname(fileURLToPath(import.meta.url));
const tokensCss = readFileSync(join(here, 'tokens.css'), 'utf8');
const themeCss = readFileSync(join(here, 'theme.css'), 'utf8');
const beamRoot = join(here, '..', '..', '..');

/** The declarations of the FIRST block whose selector list is exactly `selector`. */
function block(css: string, selector: string): Map<string, string> {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const blocks = [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const found = blocks.find(([, sel]) => sel.trim().replace(/\s+/g, ' ') === selector);
    const out = new Map<string, string>();

    for (const [, name, value] of (found?.[2] ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        out.set(name, value.trim());
    }

    return out;
}

/** Every `--beam-*` name read through `var(` in a package's shipped source (not stories/tests). */
function beamReads(): Set<string> {
    const reads = new Set<string>();
    const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
            if (name === 'node_modules' || name === 'dist') continue;
            const path = join(dir, name);
            if (statSync(path).isDirectory()) {
                walk(path);
            } else if (/\.(tsx?|css)$/.test(name) && !/\.(stories|test)\.tsx?$/.test(name) && name !== 'tokens.css') {
                // Docblocks describe the fallback idiom (`var(--beam-x, …)`); only code reads count.
                const code = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
                for (const [, token] of code.matchAll(/var\((--beam-[a-z0-9-]+)/g)) {
                    reads.add(token);
                }
            }
        }
    };

    for (const pkg of readdirSync(beamRoot)) {
        const src = join(beamRoot, pkg, 'src');
        if (pkg.startsWith('beam-') && statSync(join(beamRoot, pkg)).isDirectory()) {
            try {
                statSync(src);
            } catch {
                continue;
            }
            walk(src);
        }
    }

    return reads;
}

/** Keys a host supplies on purpose — see the header of tokens.css for why each is not shipped. */
const HOST_HOOKS = new Set([
    '--beam-fg',
    '--beam-fg-muted',
    '--beam-heading',
    '--beam-accent',
    '--beam-border',
    '--beam-surface-2',
    '--beam-radius',
    '--beam-font-sans',
    '--beam-font-mono',
    '--beam-font-display',
    '--beam-heading-weight',
]);

/** Layout and measure keys: sizes a component defaults itself, not colours. */
const isLayoutKey = (token: string) =>
    /^--beam-(ux|docs|prose|nav|page)-/.test(token) || ['--beam-measure', '--beam-gutter'].includes(token);

describe('beam-ux tokens.css', () => {
    const light = block(tokensCss, ':root');
    const dark = block(tokensCss, '.dark');
    const aliases = block(tokensCss, ':root, .dark');

    it('defines every beam-tier colour key the packages read', () => {
        const defined = new Set([...light.keys(), ...aliases.keys()]);
        const missing = [...beamReads()].filter(
            (token) => !defined.has(token) && !HOST_HOOKS.has(token) && !isLayoutKey(token),
        );

        expect(missing).toEqual([]);
    });

    it('flips every light key in .dark, so no beam surface keeps a light value in a dark scheme', () => {
        const lightOnly = [...light.keys()].filter((token) => !dark.has(token));

        expect(lightOnly).toEqual([]);
        expect(dark.size).toBe(light.size);
    });

    it('ships the status semantics shadcn lacks, with warning text light on the dark canvas', () => {
        for (const token of ['--signal', '--warning', '--warning-foreground', '--info']) {
            expect(light.has(token), token).toBe(true);
            expect(dark.has(token), token).toBe(true);
        }

        // Warning TEXT: deep amber in light, bright amber in dark (a dark ink went dark-on-dark).
        expect(light.get('--warning-foreground')).toBe('var(--beam-warn-deep)');
        expect(dark.get('--warning-foreground')).toMatch(/^oklch\(0\.8\d? /);
    });

    it('leaves the host hooks and the shadcn semantics to the host', () => {
        const all = [...light.keys(), ...dark.keys(), ...aliases.keys()];

        for (const token of all) {
            expect(HOST_HOOKS.has(token), `${token} would override the host's own theme`).toBe(false);
        }
        for (const token of ['--background', '--foreground', '--primary', '--muted', '--sidebar']) {
            expect(all).not.toContain(token);
        }
    });

    it('re-declares its aliases under .dark, so a dark subtree does not inherit a light value', () => {
        expect(aliases.get('--beam-surface')).toBe('var(--beam-paper-raised)');
    });

    it('keeps --beam-muted a surface: the prose reads a separate text token', () => {
        expect(light.get('--beam-muted')).toBe('#e6eae5');
        expect(PROSE_CSS).not.toContain('--beam-muted');
        expect(PROSE_CSS).toContain('var(--beam-fg-muted');
    });
});

/** The source text of the `@layer <name> { … }` blocks, comments stripped (one nesting level). */
function layerBody(css: string, name: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    return [...stripped.matchAll(new RegExp(`@layer\\s+${name}\\s*\\{((?:[^{}]*\\{[^{}]*\\})*[^{}]*)\\}`, 'g'))]
        .map(([, body]) => body)
        .join('\n');
}

/** Every rule as [selector, declarations], comments and at-rule wrappers ignored. */
function rules(css: string): Array<[string, Map<string, string>]> {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

    return [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => {
        const decls = new Map<string, string>();
        for (const [, name, value] of body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
            decls.set(name, value.trim());
        }

        return [sel.replace(/@layer\s+\w+\s*/g, '').trim().replace(/\s+/g, ' '), decls];
    });
}

/*
 * Research 05 (owner-review-20261102): Chrome drew its classic grey bar on every tinted surface (the deep
 * rail, sheets, tab strips, tables) whenever scroll bars show always or a mouse is attached. D-05-a puts the
 * fix here, tokenised; D-05-b keeps it to the inner containers, so the page's own bar stays the platform's.
 */
describe('beam-ux tokens.css scrollbars', () => {
    const light = block(tokensCss, ':root');
    const dark = block(tokensCss, '.dark');
    const base = rules(layerBody(tokensCss, 'base'));
    const declaring = (property: string) => rules(tokensCss).filter(([, decls]) => decls.has(property));

    it('ships a thumb and track token pair in both schemes', () => {
        for (const token of ['--beam-scrollbar-thumb', '--beam-scrollbar-track']) {
            expect(light.has(token), token).toBe(true);
            expect(dark.has(token), token).toBe(true);
        }
    });

    it('draws the thumb from the container ink and leaves the track to its surface', () => {
        // A share of `currentColor` reads on paper (dark ink) and on the rail (light rail ink) alike, in both schemes.
        for (const scheme of [light, dark]) {
            expect(scheme.get('--beam-scrollbar-thumb')).toMatch(/^color-mix\(in oklab, currentColor \d+%, transparent\)$/);
            expect(scheme.get('--beam-scrollbar-track')).toBe('transparent');
        }
    });

    it('colours every inner scroll container from the tokens, in the base layer', () => {
        const coloured = base.filter(([, decls]) => decls.has('scrollbar-color'));

        expect(coloured.map(([sel]) => sel)).toEqual([':where(body *)']);
        expect(coloured[0][1].get('scrollbar-color')).toBe('var(--beam-scrollbar-thumb) var(--beam-scrollbar-track)');
    });

    it('thins inner containers but not the main landmark, which scrolls the page in an app shell', () => {
        const thinned = base.filter(([, decls]) => decls.has('scrollbar-width'));

        expect(thinned.map(([sel, decls]) => [sel, decls.get('scrollbar-width')])).toEqual([
            [':where(body *:not(main))', 'thin'],
        ]);
    });

    it('never styles the root or body bar, and declares scrollbars nowhere outside the base layer', () => {
        // Outside a layer the rule would beat a component's own `[scrollbar-width:none]` utility.
        expect(declaring('scrollbar-color')).toHaveLength(1);
        expect(declaring('scrollbar-width')).toHaveLength(1);

        for (const [sel] of [...declaring('scrollbar-color'), ...declaring('scrollbar-width')]) {
            expect(sel).not.toMatch(/^(:root|html|body)\b/);
        }
        // The standard pair only: Chrome ignores the legacy pseudo-elements once either property is set.
        expect(tokensCss.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('::-webkit-scrollbar');
    });
});

describe('beam-ux theme.css', () => {
    it('imports the tokens and bridges each status semantic to a Tailwind colour', () => {
        expect(themeCss).toContain("@import './tokens.css';");

        for (const name of ['signal', 'warning', 'warning-foreground', 'info']) {
            expect(themeCss).toContain(`--color-${name}: var(--${name});`);
        }
    });
});
