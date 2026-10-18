# @splicewire/beam-inertia

## 0.5.0

### Minor Changes

- Delegate editor surfaces to the packaged UX editor kit and require beam-ux 0.7.0 or later in the 0.7 line.

## 0.4.0

### Minor Changes

- 7a93ed7: Move AccountShell and its account data/nav exports from beam-ux/account to
  beam-accounts/account. The old beam-ux/account entry is removed without an alias.
  Update the Inertia adapter and story together; consumers must upgrade this release
  set together. AppRail retains its default renderer and exposes router-neutral row
  and group rendering seams for sidebar primitives. Account collapse, tooltips,
  mobile disclosure, slots, prefetch and sidebar state remain host-controlled.

  Versioning policy: remain on 0.x; a minor may remove a breaking entry. Land after
  the train-3 beam-ux 0.5.0 bump, then release this move as beam-ux 0.6.0 with
  coordinated Accounts/Inertia minors and matching peer ranges.

- 201a73e: Make the login "Sign up" affordance follow the server registration policy. The packaged login page
  now gates the `/register` link on the `canRegister` page prop — sourced from
  `Features::enabled(Features::registration())`, the same Fortify feature registry the `/register`
  route reads — instead of the build-time client `featureEnabled('registration')` flag. On a
  closed-door host (`ACCOUNT_REGISTRATION=closed`, where `/register` 404s) the link no longer renders
  as a dead affordance; it mirrors the existing `canResetPassword` prop convention.

  `@splicewire/beam-resources` gains the `canRegister: undefined | boolean` field on `AuthEntryPageData`
  (the projection of the beam-accounts DTO field).

  Host contract: the Fortify auth-view closures must now share `canRegister` on the auth-entry props
  for the link to render on an open-registration host (the beam starters' `loginView` follow in the
  same lineage once this is released). A host that does not share it simply shows no Sign up link.

### Patch Changes

- ff7e5e7: Fix the dashboard sidebar user chip (G1-BEAM-FRESH-INSTALL): on a fresh install the chip rendered
  unstyled — avatar and name stacked, no menu control — because the IA-3 consolidation moved the user
  menu onto `RealmSwitcher`, whose trigger is a bare `<button>` with no layout, dropping the old
  `SidebarMenuButton` + `ChevronsUpDown` chrome.

  `@splicewire/beam-ux` `RealmSwitcher` gains a `triggerClassName` prop applied to the trigger button,
  so each shell styles the trigger for its slot. The trigger is otherwise unchanged — a consumer that
  passes no `triggerClassName` (e.g. a plain-text header trigger) renders byte-identically to before.

  `@splicewire/beam-inertia` `NavUser` passes the sidebar menu-button chrome (full-width flex row, so
  the avatar and name sit side-by-side rather than stacking, plus hover/open state) and restores the
  `ChevronsUpDown` menu-control affordance to the label.

- Updated dependencies [201a73e]
  - @splicewire/beam-resources@0.1.3

## 0.3.0

### Minor Changes

- Accept @splicewire/beam-ux 0.5 while preserving compatibility with 0.4 consumers.

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
