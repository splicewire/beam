# @splicewire/beam-inertia

## 0.2.0

### Minor Changes

- Require `@splicewire/beam-ux` 0.4.0 (peer `^0.4.0`): `use-appearance` re-exports the appearance contract from `@splicewire/beam-ux/appearance`, which beam-ux first ships in 0.4.0. Hosts on beam-ux 0.3 stay on beam-inertia 0.1.x.

### Patch Changes

- 805b60e: Frame icon map: key every icon name a family resource declares in kebab case (`receipt`,
  `shield-check`, `mic`, …) so rail rows and cards draw their declared lucide glyph instead of the
  fallback (`507f87c`, `203393a`). The published `0.1.3` dist has no icon map (`receipt` absent);
  `renderLink` and `manifestLookup` were already in `0.1.3` (`d86e0cb` precedes the `dc5833d` bump).

## 0.1.3

Require Frame 0.2 and UI 0.1.1 so the packaged resource transport, manifest lookup and card widgets resolve against compatible published dependencies.
