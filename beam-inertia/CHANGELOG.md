# @splicewire/beam-inertia

## 0.2.0

### Minor Changes

- 15b8a4f: Require `@splicewire/beam-ux` 0.4.0: the peer moves from `^0.2.1 || ^0.3.0` to `^0.4.0`, because `use-appearance`
  re-exports the appearance contract from `@splicewire/beam-ux/appearance`, which beam-ux first ships in 0.4.0.
  Hosts on beam-ux 0.3 stay on beam-inertia 0.1.x. Release this only after `@schemastud/frame` (with
  `FrameActionError`, `parseResourcePage`, `useBrowserUrlState`) and `@splicewire/beam-accounts` (with
  `CreateTeamForm`, `AcceptInvitationPanel`) are published, and raise beam-inertia's peer ranges on them to those
  versions in the same release.

### Patch Changes

- 805b60e: Frame icon map: key every icon name a family resource declares in kebab case (`receipt`,
  `shield-check`, `mic`, …) so rail rows and cards draw their declared lucide glyph instead of the
  fallback (`507f87c`, `203393a`). The published `0.1.3` dist has no icon map (`receipt` absent);
  `renderLink` and `manifestLookup` were already in `0.1.3` (`d86e0cb` precedes the `dc5833d` bump).

## 0.1.3

Require Frame 0.2 and UI 0.1.1 so the packaged resource transport, manifest lookup and card widgets resolve against compatible published dependencies.
