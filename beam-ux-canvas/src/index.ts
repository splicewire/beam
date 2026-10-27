// @splicewire/beam-ux-canvas — optional VFX decoration for beam surfaces. "Effects decorate, they
// never replace": every effect wraps real, shippable DOM; the real component tree is always
// present underneath. Promoted out of splicewire-app's app-local beam-ux-canvas prototype.
//
// The machinery: the tier model (`resolveTier`), the boundary that resolves it for a subtree
// (`FxBoundary`, user tier as a prop — no store), the decorator (`FxEffect`, overlay `under` or
// `over`), the capability gates, the renderer strategy and the dynamic `three` loader.

export { ParticleObject } from './particle-object';
export type { ParticleObjectProps } from './particle-object';
export {
    canWebGl,
    canHtmlInCanvas,
    detectCapabilityTier,
    prefersReducedMotion,
    useCapabilityTier,
    usePrefersReducedMotion,
} from './capability';
export type { FxFailureSite } from './capability';
export { resolveTier, minTier, minOfTiers, SURFACE } from './tiers';
export type { EffectTier, Surface, SurfaceConfig, ResolveInput } from './tiers';
export { selectRenderer } from './renderers';
export type { RendererKind } from './renderers';
export { FxBoundary, useFx } from './fx-boundary';
export type { FxBoundaryProps, FxContextValue } from './fx-boundary';
export { FxEffect } from './fx-effect';
export type { FxEffectProps, FxKind, FxPlacement } from './fx-effect';
export { loadThree } from './load-three';
export type { ThreeModule } from './load-three';
