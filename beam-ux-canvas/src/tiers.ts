/**
 * The tier arithmetic behind the "visual effects" preference. Pure, so it unit-tests without a DOM
 * (`tiers.test.ts`). `<FxBoundary>` feeds it the user tier (a prop), the capability tier and the
 * reduced-motion fact; everything here is data.
 *
 * The one rule: the effective tier a surface renders at is
 *   effective = reducedMotion ? off : min(surface ceiling, userTier ?? surface default, capability)
 * The user's tier can only ratchet *down* from a surface's ceiling, never up.
 *
 * Promoted as-is from splicewire-app's prototype (`ui/src/_prototype/beam-ux-canvas/_fx/tiers.ts`,
 * landing-motion ticket 06 point 1).
 */

/** Tri-tier, ordered off < lite < full. */
export type EffectTier = 'off' | 'lite' | 'full';

/** The three UX surface families, each with its own ceiling + default. */
export type Surface = 'operate' | 'persuade' | 'experience';

/** Rank for min/clamp arithmetic; higher = more effects. */
const RANK: Record<EffectTier, number> = { off: 0, lite: 1, full: 2 };
const BY_RANK: EffectTier[] = ['off', 'lite', 'full'];

/** The lower (fewer-effects) of two tiers. */
export function minTier(a: EffectTier, b: EffectTier): EffectTier {
    return RANK[a] <= RANK[b] ? a : b;
}

/** The lower of an arbitrary list of tiers (`off` if empty). */
export function minOfTiers(tiers: EffectTier[]): EffectTier {
    return BY_RANK[Math.min(...tiers.map((t) => RANK[t]), RANK.full)];
}

export interface SurfaceConfig {
    /** Where the surface sits before the user touches the global toggle. */
    default: EffectTier;
    /** The highest tier the surface will ever render, however high the user toggles. */
    ceiling: EffectTier;
}

/**
 * Surface defaults + ceilings (PRD §Enablement). Operate is the precision instrument:
 * off by default, and it will never light up beyond `lite` even at user `full`.
 * Persuade/Experience are the full toy box.
 */
export const SURFACE: Record<Surface, SurfaceConfig> = {
    operate: { default: 'off', ceiling: 'lite' },
    persuade: { default: 'full', ceiling: 'full' },
    experience: { default: 'full', ceiling: 'full' },
};

export interface ResolveInput {
    surface: Surface;
    /** The user's global toggle. `null` = untouched → use the surface default. */
    userTier: EffectTier | null;
    /** Ceiling imposed by the device/browser (`off` when no WebGL). */
    capabilityTier: EffectTier;
    /** OS/demo `prefers-reduced-motion: reduce` — a hard kill switch to `off`. */
    reducedMotion: boolean;
}

/**
 * The single resolution rule. Reduced motion (or no capability, expressed as an
 * `off` capability tier) forces `off`; otherwise clamp the effective tier to the
 * lowest of {surface ceiling, user's global tier (or surface default if untouched),
 * capability}.
 */
export function resolveTier({
    surface,
    userTier,
    capabilityTier,
    reducedMotion,
}: ResolveInput): EffectTier {
    if (reducedMotion) return 'off';
    const cfg = SURFACE[surface];
    const base = userTier ?? cfg.default;
    return minOfTiers([cfg.ceiling, base, capabilityTier]);
}
