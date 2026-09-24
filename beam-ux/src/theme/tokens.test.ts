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

describe('beam-ux theme.css', () => {
    it('imports the tokens and bridges each status semantic to a Tailwind colour', () => {
        expect(themeCss).toContain("@import './tokens.css';");

        for (const name of ['signal', 'warning', 'warning-foreground', 'info']) {
            expect(themeCss).toContain(`--color-${name}: var(--${name});`);
        }
    });
});
