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

## The host-shell factory (`createMainframeHost`)

The seam above is the _mechanism_. But every beam site re-implemented the **same** host wiring on top
of it — the registry construction, the `domain`/`window` mode components, the mode state, the
entry-body load, the `can` gate, the `?beam_entry` override, the kind-aware `main` fork. splicewire-app's
`DocsHost` and audiostud's `mainframe-host.tsx` were the same ~380-line shape. **`createMainframeHost`
promotes that shape here** (the README's long-promised "modes ship separately" — now bundled): a host
writes ~15 lines of config and gets the framed Inertia layout.

```tsx
export default createMainframeHost<PageBody>({
  componentToEntry,                 // Inertia component name → beam-ux entry slug (map; slash-swap fallback)
  usePageContext: () => ({ ... }),  // host wraps Inertia usePage → { component, canAuthor, slug? }
  loadEntryBody,                    // host injects the transport (route it through beam-ux's UxBuilderClient)
  ribbon,                           // the host's frame chrome as a render-prop ({ mode, entrySlug, … })
  renderEditor, renderRead, renderInspector,  // host-local renderers (carry the heavy author-only deps)
});
```

It ships `createMainframeHost` + the OOTB `DomainMainframe`/`WindowMainframe` mode components +
`useBeamUxEntry` (the seam a reshelled page reads its chrome through) + `isPuckBody` (the shared
kind test) + `defaultRibbon` (the shell a host with no `ribbon` gets).

**Topology:** the factory stays **dependency-pure** (react-only). It does **not** import
`@splicewire/beam-ux` for entry loading — the host _injects_ `loadEntryBody` (routing it through
beam-ux's `UxBuilderClient` on its side), so no `beam-mainframe → beam-ux` edge is introduced. The
three renderers stay host-local for the same reason: the package owns the _fork_, the host owns the
heavy _renderers_.

## Status

Ticket 03 (delegation + registry seam) landed here. Ticket 06 promoted the **host-shell factory**
(`createMainframeHost` + OOTB `domain`/`window` modes + `useBeamUxEntry`) — retiring the DocsHost /
mainframe-host duplication. The `desk`/`workspace` modes (tickets 04/05) remain separate.

## Dev loop

`file:`-overlaid into the app's `ui/` build. Edit `src/`, rebuild `dist/` (`npm run build`, or
`npm run dev` for watch) — **never npm-reinstall**; the overlay is live.
