/**
 * The renderer-strategy contract — the pluggable seam that makes the tech bet safe. An effect is a
 * WRAPPER around real DOM; *how* it composites is a strategy chosen here:
 *
 *   • `webgl-overlay` (ships now, #1) — composite a shader layer over (or under) the DOM subtree.
 *   • `html-in-canvas` (later, #2) — same tree; the boundary samples the DOM as a texture.
 *
 * Swapping #1 → #2 is this one function returning a different string once `canHtmlInCanvas()`
 * flips true — the component tree underneath never changes. `off` selects no renderer at all, so
 * descendants render bare (graceful degradation is the doctrine).
 *
 * Promoted from splicewire-app's prototype (`ui/src/_prototype/beam-ux-canvas/_fx/renderers.ts`).
 */
import { canHtmlInCanvas } from './capability';
import type { EffectTier } from './tiers';

export type RendererKind = 'webgl-overlay' | 'html-in-canvas';

/**
 * Pick the compositing strategy for an effective tier. `off` → `null` (no renderer, bare
 * children). Otherwise prefer the #2 renderer when its capability is present (never today), else
 * the shippable #1 overlay. This is the entire #1→#2 upgrade surface.
 */
export function selectRenderer(tier: EffectTier): RendererKind | null {
    if (tier === 'off') return null;
    return canHtmlInCanvas() ? 'html-in-canvas' : 'webgl-overlay';
}
