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

Promoted out of `splicewire-app`'s app-local `beam-ux-canvas` prototype
(`ui/src/_prototype/beam-ux-canvas/`) — see that repo's
`docs/agents/beam-ux-canvas.design-note.md` for the full tri-tier enablement doctrine
(`FxBoundary`/`FxEffect`/`useEffectsStore`) this package is expected to grow into.
