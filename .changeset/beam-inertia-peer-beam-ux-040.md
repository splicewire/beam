---
'@splicewire/beam-inertia': minor
---

Require `@splicewire/beam-ux` 0.4.0: the peer moves from `^0.2.1 || ^0.3.0` to `^0.4.0`, because `use-appearance`
re-exports the appearance contract from `@splicewire/beam-ux/appearance`, which beam-ux first ships in 0.4.0.
Hosts on beam-ux 0.3 stay on beam-inertia 0.1.x. Release this only after `@schemastud/frame` (with
`FrameActionError`, `parseResourcePage`, `useBrowserUrlState`) and `@splicewire/beam-accounts` (with
`CreateTeamForm`, `AcceptInvitationPanel`) are published, and raise beam-inertia's peer ranges on them to those
versions in the same release.
