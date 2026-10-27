import { describe, expect, it } from 'vitest';
import { minTier, minOfTiers, resolveTier, SURFACE, type EffectTier } from './tiers';

/**
 * The load-bearing arithmetic of the effects tier (promoted with `tiers.ts` from the flagship
 * prototype). These pin the concrete tier semantics: min-clamp, surface ceilings, and the two hard
 * kill switches (reduced-motion, no-capability). Pure — no DOM needed. The full
 * {reducedMotion} × {surface} × {userTier} × {capability} matrix is `tiers.matrix.test.ts`.
 */
describe('minTier / minOfTiers', () => {
    it('picks the fewer-effects tier', () => {
        expect(minTier('full', 'lite')).toBe('lite');
        expect(minTier('off', 'full')).toBe('off');
        expect(minTier('lite', 'lite')).toBe('lite');
    });

    it('mins an arbitrary list, defaulting to off when empty', () => {
        expect(minOfTiers(['full', 'lite', 'off'])).toBe('off');
        expect(minOfTiers(['full', 'full'])).toBe('full');
        expect(minOfTiers([])).toBe('full'); // no constraints → unclamped ceiling
    });
});

describe('resolveTier', () => {
    const full: EffectTier = 'full';

    it('operate defaults to off before the user touches the toggle', () => {
        expect(
            resolveTier({ surface: 'operate', userTier: null, capabilityTier: full, reducedMotion: false }),
        ).toBe('off');
    });

    it('persuade/experience default to full', () => {
        expect(
            resolveTier({ surface: 'persuade', userTier: null, capabilityTier: full, reducedMotion: false }),
        ).toBe('full');
        expect(
            resolveTier({ surface: 'experience', userTier: null, capabilityTier: full, reducedMotion: false }),
        ).toBe('full');
    });

    it('clamps the user tier to the operate ceiling — raising to full cannot exceed lite', () => {
        expect(
            resolveTier({ surface: 'operate', userTier: 'full', capabilityTier: full, reducedMotion: false }),
        ).toBe('lite');
        expect(SURFACE.operate.ceiling).toBe('lite');
    });

    it('lets the user ratchet a full surface down', () => {
        expect(
            resolveTier({ surface: 'persuade', userTier: 'lite', capabilityTier: full, reducedMotion: false }),
        ).toBe('lite');
        expect(
            resolveTier({ surface: 'persuade', userTier: 'off', capabilityTier: full, reducedMotion: false }),
        ).toBe('off');
    });

    it('reduced motion forces off regardless of everything else', () => {
        expect(
            resolveTier({ surface: 'experience', userTier: 'full', capabilityTier: full, reducedMotion: true }),
        ).toBe('off');
    });

    it('no capability (off capability tier) forces off', () => {
        expect(
            resolveTier({ surface: 'experience', userTier: 'full', capabilityTier: 'off', reducedMotion: false }),
        ).toBe('off');
    });

    it('capability caps the effective tier (lite device on a full surface)', () => {
        expect(
            resolveTier({ surface: 'experience', userTier: 'full', capabilityTier: 'lite', reducedMotion: false }),
        ).toBe('lite');
    });
});
