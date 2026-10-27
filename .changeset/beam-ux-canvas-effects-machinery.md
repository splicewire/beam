---
"@splicewire/beam-ux-canvas": minor
---

Promote the effects machinery from splicewire-app's prototype: the tier model (`resolveTier`, `SURFACE`, `minTier`, `minOfTiers`), `FxBoundary` with `userTier` as a prop plus `onUserTierChange` and `useFx().setUserTier` (no store), `FxEffect` (bare outside a boundary and at `off`; overlay `placement: 'under' | 'over'`), `selectRenderer`, `detectCapabilityTier` / `useCapabilityTier`, the dynamic `loadThree()`, and `FxCanvas`, the one lifecycle seam a scene's `build(three, ctx)` / `frame(t, dt, inputs)` mounts through (rAF loop and pauses, lazy mount, DPR caps, `requestFrame()`, `fx:tick` measures, resize and exclusion rects, disposal, late WebGL failure pinned off). `ParticleObject` is now the seam's first consumer, with the same props and standalone behaviour, and no longer imports `three` statically.
