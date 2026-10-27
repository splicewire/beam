# @splicewire/beam-ux-canvas

Optional VFX decoration for beam surfaces. **Effects decorate, they never replace**: every effect
in this package wraps real, shippable DOM — the real component tree is always present, focusable,
and accessible underneath; an effect is a `pointer-events-none` overlay on top of it, never a
replacement for it.

## `ParticleObject`

A GPU point cloud (Three.js) sampled from a source image, with cursor scatter + spring-damper
return. Self-gates behind WebGL capability and `prefers-reduced-motion` — with neither available it
mounts an empty, inert div.

```tsx
import { ParticleObject } from '@splicewire/beam-ux-canvas';

<div className="relative h-[560px] w-[560px]">
    <ParticleObject src="/brand/mark.svg" tint="#00b3c8" count={3500} />
</div>;
```

## Tiers, the boundary and the effect

One rule resolves the tier a subtree renders at:
`effective = reducedMotion ? off : min(surface ceiling, userTier ?? surface default, capability)`, with
`persuade {default full, ceiling full}` and `operate {default off, ceiling lite}` (`resolveTier`, `SURFACE`).

```tsx
import { FxBoundary, FxCanvas, FxEffect, useFx } from '@splicewire/beam-ux-canvas';

// The host holds the visitor's preference (no store in the package) and hears changes.
<FxBoundary mode="persuade" userTier={paused ? 'off' : null} onUserTierChange={setTier}>
    <FxEffect placement="under" overlay={<FxCanvas scene={loadScene} />}>
        <Hero />
    </FxEffect>
</FxBoundary>;

// A descendant control writes without a store; a CSS island reads the tier itself.
const { effectiveTier, setUserTier } = useFx();
```

- `FxBoundary` renders only a context provider. `FxEffect` renders its children **bare** (no wrapper)
  outside a boundary, at `off`, and under reduced motion; above `off` it wraps them with `data-fx-tier`
  and one overlay layer, `under` (beneath the DOM) or `over`.
- `FxCanvas` is the one lifecycle seam. A scene implements `build(three, ctx)` and `frame(t, dt, inputs)`;
  the seam owns the rAF loop and its pauses (offscreen, hidden tab, `paused`, tier `off`), the lazy mount
  (`scene()` and `three` requested on approach, `rootMargin` 25 %), the DPR cap (2 at `full`, 1.5 at `lite`),
  `requestFrame()` for a parked loop, `performance.measure('fx:tick')`, resize and exclusion rects,
  disposal with `forceContextLoss()`, and late WebGL failure (one `console.warn`, the capability pinned
  `off` for the page).
- `three` is a peer, loaded only through `loadThree()`'s dynamic `import('three')`, so the host's bundler
  splits it into its own chunk.

Promoted out of `splicewire-app`'s app-local `beam-ux-canvas` prototype
(`ui/src/_prototype/beam-ux-canvas/`) — see that repo's
`docs/agents/beam-ux-canvas.design-note.md` for the tri-tier enablement doctrine. The prototype's
`useEffectsStore` is not promoted: the preference is the host's, passed as `userTier`.
