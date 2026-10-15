---
'@splicewire/beam-ux': minor
'@splicewire/beam-inertia': patch
---

Fix the dashboard sidebar user chip (G1-BEAM-FRESH-INSTALL): on a fresh install the chip rendered
unstyled — avatar and name stacked, no menu control — because the IA-3 consolidation moved the user
menu onto `RealmSwitcher`, whose trigger is a bare `<button>` with no layout, dropping the old
`SidebarMenuButton` + `ChevronsUpDown` chrome.

`@splicewire/beam-ux` `RealmSwitcher` gains a `triggerClassName` prop applied to the trigger button,
so each shell styles the trigger for its slot. The trigger is otherwise unchanged — a consumer that
passes no `triggerClassName` (e.g. a plain-text header trigger) renders byte-identically to before.

`@splicewire/beam-inertia` `NavUser` passes the sidebar menu-button chrome (full-width flex row, so
the avatar and name sit side-by-side rather than stacking, plus hover/open state) and restores the
`ChevronsUpDown` menu-control affordance to the label.
