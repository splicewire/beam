import { describe, expect, it } from 'vitest';
import { resolveTier, SURFACE, type EffectTier, type Surface } from './tiers';

/**
 * `resolveTier` over the whole matrix {reducedMotion} × {persuade, operate} × {userTier} × {capability}
 * (landing-motion build/01, receipt 2). The expectations are written out literally per surface —
 * not recomputed — so the table is the specification:
 *   effective = reducedMotion ? off : min(ceiling, userTier ?? default, capability)
 *   persuade {default full, ceiling full}; operate {default off, ceiling lite}.
 */
const USER: (EffectTier | null)[] = [null, 'off', 'lite', 'full'];
const CAPABILITY: EffectTier[] = ['off', 'lite', 'full'];

// expected[surface][userTier ?? 'untouched'] = [at capability off, lite, full]
const EXPECTED: Record<'persuade' | 'operate', Record<string, [EffectTier, EffectTier, EffectTier]>> = {
    persuade: {
        untouched: ['off', 'lite', 'full'],
        off: ['off', 'off', 'off'],
        lite: ['off', 'lite', 'lite'],
        full: ['off', 'lite', 'full'],
    },
    operate: {
        untouched: ['off', 'off', 'off'],
        off: ['off', 'off', 'off'],
        lite: ['off', 'lite', 'lite'],
        full: ['off', 'lite', 'lite'],
    },
};

describe('resolveTier matrix', () => {
    it('the surface table is persuade {full, full} and operate {off, lite}', () => {
        expect(SURFACE.persuade).toEqual({ default: 'full', ceiling: 'full' });
        expect(SURFACE.operate).toEqual({ default: 'off', ceiling: 'lite' });
    });

    for (const reducedMotion of [false, true]) {
        for (const surface of ['persuade', 'operate'] as const satisfies readonly Surface[]) {
            for (const userTier of USER) {
                CAPABILITY.forEach((capabilityTier, i) => {
                    const expected: EffectTier = reducedMotion ? 'off' : EXPECTED[surface][userTier ?? 'untouched'][i];
                    it(`reducedMotion=${reducedMotion} ${surface} userTier=${userTier} capability=${capabilityTier} → ${expected}`, () => {
                        expect(resolveTier({ surface, userTier, capabilityTier, reducedMotion })).toBe(expected);
                    });
                });
            }
        }
    }
});
