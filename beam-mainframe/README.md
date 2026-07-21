# @splicewire/beam-mainframe

The **app-level frame that hosts schemastud Frames** — the missing site-shell for a beam site. A
_Mainframe_ is the outer frame that hosts Frame's inner surfaces (`ListShell`/`EditShell`); it
**co-locates** render + edit spatially, it does not weld the runtimes (ADR-0090 T07, ADR-0099).

This package is the **seam**, not the modes. It ships:

- **The frozen slot contract** (`contract.ts`) — the named slots every mode honors, as types +
  tables. Core = `{brand, rail, topBar.lead, topBar.actions, main, overlay}`; optional =
  `{railFooter, command, status, footer}`. Three fill-types: `single-node`, `ordered-multi-source`
  (sorted by `(zone, order, registration-index)`), `render-prop` (`main`). This is to **Mainframe**
  what JSON Schema is to **Frame**.
- **The named-slot registry** (`createSlotRegistry`) — the _socket_: a fresh-per-scope (SSR-safe),
  ordered, subscribable collection of contributions. Mirrors Frame's `WidgetRegistry` idiom.
- **The Mainframe registry** (`createMainframeRegistry`) — `register(mode, Mainframe)`, where a
  Mainframe is `({ slots, ctx }) => ReactNode`. OTB modes and a site's own bespoke shell register
  by the same call.
- **The host-delegation seam** (`MainframeProvider` + `MainframeOutlet`) — the host owns providers,
  router, `can`, mode state, and the slot collection; the outlet selects a Mainframe by mode and
  hands it the resolved slots. Mode-switch = **child-swap under a stable host** (no provider remount
  → state preserved).
- **The resolver** (`resolveSlots`) — gates contributions by `can` (the entitlement axis; the public
  view falls out as edit contributions gate to empty), sorts ordered slots, picks the single-node
  winner, dev-warns unknown slots. Never throws.

## The two axes

- **Mode** (`window`/`desk`/`workspace`) — a spatial slot-_placement_ strategy. The mode owns
  placement; a slot is placement-neutral.
- **Entitlement** (`can`) — gates _which contributions render_. Public "view" = `window` ∩
  no-edit-entitlement: the same tree, gated down to the bare site.

## Status

Ticket 03 (delegation + registry seam) landed here. Modes ship separately: `desk` (ticket 04,
wires splicewire-app's `AppShell`) and `window` (ticket 05). No modes are bundled in this package.

## Dev loop

`file:`-overlaid into the app's `ui/` build. Edit `src/`, rebuild `dist/` (`npm run build`, or
`npm run dev` for watch) — **never npm-reinstall**; the overlay is live.
