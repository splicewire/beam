// @splicewire/beam-ux-canvas — optional VFX decoration for beam surfaces. "Effects decorate, they
// never replace": every effect wraps real, shippable DOM; the real component tree is always
// present underneath. Promoted out of splicewire-app's app-local beam-ux-canvas prototype.

export { ParticleObject } from './particle-object';
export type { ParticleObjectProps } from './particle-object';
export { canWebGl, canHtmlInCanvas, prefersReducedMotion, usePrefersReducedMotion } from './capability';
