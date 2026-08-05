import type { Config, Data } from '@measured/puck';
import { describe, expect, it } from 'vitest';
import { createPuckRegistry, resolvePuck } from './PuckRegistry.js';

// Minimal stand-ins: a `config` is just its component keys; a `seed` emits a fixed block list.
const cfg = (names: string[]): Config =>
    ({ components: Object.fromEntries(names.map((n) => [n, { render: () => null }])) }) as unknown as Config;
const seed = (blocks: string[]) => (_slug: string): Data =>
    ({ root: {}, content: blocks.map((t, i) => ({ type: t, props: { id: `${t}-${i}` } })), zones: {} }) as Data;

describe('PuckRegistry', () => {
    const flat = { config: cfg(['Heading', 'Prose', 'ResourceList']), seed: seed(['Heading', 'Prose', 'ResourceList']) };
    const marketing = { config: cfg(['Hero', 'TheLoop', 'FinalCta']), seed: seed(['Hero', 'TheLoop', 'FinalCta']) };
    const registry = createPuckRegistry({ default: flat, byKey: { home: marketing } });

    it('resolves a registered key to its own vocabulary', () => {
        expect(resolvePuck(registry, 'home')).toBe(marketing);
    });

    it('falls back to `default` for an unregistered or absent key', () => {
        expect(resolvePuck(registry, 'library-lyrics')).toBe(flat);
        expect(resolvePuck(registry, undefined)).toBe(flat);
        expect(resolvePuck(registry, null)).toBe(flat);
    });

    it('binds config + seed atomically — every seed block exists in its OWN config (ticket-01 invariant)', () => {
        for (const v of [flat, marketing]) {
            const emitted = v.seed('x').content.map((n) => (n as { type: string }).type);
            const declared = Object.keys((v.config as unknown as { components: Record<string, unknown> }).components);
            expect(emitted.filter((t) => !declared.includes(t))).toEqual([]);
        }
    });

    it('cannot resolve a marketing seed under the flat config — the pairing is unrepresentable', () => {
        // The registry only ever hands back a whole vocabulary, so the flat config never travels with the
        // marketing seed (the exact mismatch ticket 01 patched at one mount).
        const resolved = resolvePuck(registry, 'home');
        const declared = Object.keys((resolved.config as unknown as { components: Record<string, unknown> }).components);
        expect(declared).toContain('Hero');
        expect(declared).not.toContain('Heading');
    });
});
