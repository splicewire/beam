# @splicewire/beam-ux

## 0.6.0

### Minor Changes

- 169aa3a: Move AccountShell and its account data/nav exports from beam-ux/account to
  beam-accounts/account. The old beam-ux/account entry is removed without an alias.
  Update the Inertia adapter and story together; consumers must upgrade this release
  set together. AppRail retains its default renderer and exposes router-neutral row
  and group rendering seams for sidebar primitives. Account collapse, tooltips,
  mobile disclosure, slots, prefetch and sidebar state remain host-controlled.

  Versioning policy: remain on 0.x; a minor may remove a breaking entry. Land after
  the train-3 beam-ux 0.5.0 bump, then release this move as beam-ux 0.6.0 with
  coordinated Accounts/Inertia minors and matching peer ranges.

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

- 233587c: Add a router-neutral app shell, injected navigation rail and typed runtime factory to the appshell entry. Hosts retain route creation, outlet rendering, authorization, feature rosters and mounting.
- 7d10b69: `StateBoundary` refusals are no longer dead ends. An optional `wayBack` (`{ label, target }`) renders a way back on every refusal/failure state — forbidden, not-found, and the error fallback beside "Try again" — and on the default upsell copy. It defaults to a plain `<a href={target}>`; pass an optional `render({ target, className, children })` to route it through the host's own router (e.g. react-router's `<Link>`) instead of a full page reload. Also exports `ForbiddenState`, the forbidden page-state node (it owns `data-page-state="forbidden"`), so a known refusal with no query behind it renders the shared refusal directly instead of faking a 403 query. Existing states and the retry policy are unchanged.

### Patch Changes

- 3d22d60: Dismiss an open realm switcher with Escape and return focus to its trigger.

## 0.5.0

### Minor Changes

- 8ccb81f: Expose the app runtime Provider for transport adapters, support an explicitly unframed outlet, and export the shared mode placements so existing shell APIs can delegate without duplicating chrome.

## 0.4.0

### Minor Changes

- Release the realm navigation, appearance and docs-chrome work accumulated since 0.3.0: `RealmSwitcher`,
  `RealmHeader` and `useCurrentRealm` with zone-aware `RealmNav`; one appearance contract at
  `@splicewire/beam-ux/appearance` (light, dark or system); the page-state module at `@splicewire/beam-ux/state`;
  `<AuthorNote>` for dev-only author chrome; the opt-in token layer with `tokens-docs.css` scoped to `.beam-docs`;
  and `./theme.css` shipped in `dist`.

### Patch Changes

- 54f3933: Raise the docs accent contrast so prose links and linked inline code meet WCAG AA in light and dark themes.
- b998399: Keep the RealmSwitcher sign-out door as a full-page navigation when hosts inject a client-side router link.
