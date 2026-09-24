# @splicewire/beam-ux

The beam UX-builder surfaces, authored pre-packaged and DTO-first (rehome-ui, ADR-0116). Portable,
tenancy-agnostic components that own their react-query data logic, take transport + feedback as
injected services (never app-local imports), and import no router. Generic UI comes from the
`@schemastud/ui` foundation; the palette/fonts/wordmark stay HOST-LOCAL (passed via className/style/
CSS-vars).

## Subpaths

| Entry | What it ships |
|---|---|
| `.` | The in-app visual editing surfaces (region inspector, overlay editor, region canvas, structure panel). |
| `./blockdoc` · `./leaf` | The lossless `.tsx⟷AST` BlockDoc lens, the pluggable rich-text leaf. |
| `./admin` | The `BeamUxEntry` admin lifecycle surface — a standalone `RowActions` component (edit/duplicate/delete/promote-to-central). |
| `./blockdoc/json` | **Babel-free** JSON projection of BlockDoc — the visual-editor runtime shape (`JsonNode`) + immutable edit ops. Safe for the client bundle. |
| `./site` | Generic public-site chrome, prose, compiled entry bodies and manifest tables. API reference rendering lives in `@splicewire/beam-docs`. |
| `./docs` | Generic chrome registry, reading templates and entry-page configuration. `@splicewire/beam-docs` explicitly registers its optional documentation layout. |
| `./account` | Generic authed-account chrome — `AccountShell` + `AccountNav` (ticket 13). |
| `./shell` | The **realm-aware OS-shell layer** — `buildAppsFromManifest` over the canonical `@schemastud/mainframe/os` chrome (ADR-0017). |
| `./theme.css` · `./tokens.css` | The **opt-in beam token layer** — every `--beam-*` colour primitive and the status semantics, light and `.dark` (ADR 0002). Stylesheets only; nothing in the JS imports them. |

## `@splicewire/beam-ux/theme.css` — the opt-in token layer

Beam chrome reads the beam tier's raw keys (`--beam-paper`, `--beam-ink-45`, `--beam-warn-deep`, …) and
four status semantics shadcn lacks (`--signal`, `--warning`, `--warning-foreground`, `--info`). A host
that defines none of them imports the defaults from its own stylesheet:

```css
@import 'tailwindcss';
@import '@splicewire/beam-ux/theme.css'; /* tokens + the Tailwind bridge for bg-warning, text-info, … */

/* Override by re-declaring the beam key after the import — light on :root, dark on .dark. */
:root { --beam-green: #0b6bcb; }
.dark { --beam-green: oklch(0.75 0.14 250); }
```

`tokens.css` is the same without the `@theme inline` bridge, for a host without Tailwind. A host with its
own palette may instead bind the keys itself (the flagship maps them onto `--splice-*`). Fonts and the
site-content hooks `<Prose>` reads (`--beam-fg`, `--beam-fg-muted`, `--beam-heading`, `--beam-accent`,
`--beam-border`, `--beam-surface-2`) are not shipped: they fall back to the surrounding ink so a site
keeps its own theme. `--beam-muted` is a surface; dimmed prose text is `--beam-fg-muted`.
See [ADR 0002](../docs/adr/0002-beam-ux-ships-an-opt-in-token-layer.md).

## `@splicewire/beam-ux/blockdoc/json` — the visual-editor runtime shape

The BlockDoc lens (`./blockdoc`) is lossless but AST-backed — it pulls recast/@babel and is a
**build/server** concern. `./blockdoc/json` is its **Babel-free** mirror: a plain, serializable
`JsonNode` tree (`kind: 'block' | 'text' | 'opaque'`) plus immutable edit ops, so the visual editor
canvas can edit + persist it in the client bundle without ever loading Babel (ADR-0016).

```ts
// server / build boundary (the `./blockdoc` index — Babel-side):
import { parse, toJson, fromJson } from '@splicewire/beam-ux/blockdoc';
const doc = toJson(parse(tsxSource));        // .tsx ▶ JsonNode[]  (persist this)
const back = fromJson(doc);                  // JsonNode[] ▶ BlockDoc  (= parse(jsonToTsx(doc)))

// browser (the canvas — Babel-free):
import { getAt, updateAt, setText, type JsonDoc } from '@splicewire/beam-ux/blockdoc/json';
```

- `toJson(BlockDoc | BlockNode | BlockChild[]) → JsonNode[]` — AST-free projection (pure).
- `jsonToTsx(JsonNode[]) → string` — a pure JSX printer (no Babel).
- `fromJson(JsonNode[]) → BlockDoc` — re-parses (Babel-side; from the `./blockdoc` index).
- Edit ops (pure, immutable): `getAt` · `updateAt` · `insertInto` · `removeAt` · `moveBefore` ·
  `setProp` · `removeProp` · `setText` · `propValue`, addressed by dotted path (`"0.2"` = `doc[0].children[2]`).
- `JsonOpaque` is the ONE sealed-island concept (a `.map`/conditional the static lens can't decompose,
  carried verbatim); further opacity is a per-node **policy overlay** the canvas computes, not a shape.

## `@splicewire/beam-ux/shell` — the realm-aware OS-shell layer

The generic desktop chrome + window manager are **canonical in `@schemastud/mainframe/os`**
(`buildDesktopChrome`, `Dock`/`Launcher`/`Clock`/`UpsellPopover`/`WorkspacePersistence`,
`OperatorOverlay`, `useWindowManager`) — realm-agnostic, reading a flat `DesktopApp[]`. This subpath is
the **thin beam layer** on top: it turns the server-resolved realm **manifest** into that
`DesktopApp[]`, applying entitlement gating (locked/upsell) + auto-surfacing. It re-exports the
schemastud chrome so a host imports the whole OS story from here.

> The old ticket-11 `<Shell>` component + its duplicate `windowManager.ts` reducer were **orphaned**
> (the live product rode `@schemastud/mainframe/os`) and are **retired** (ADR-0017). This subpath is now
> the realm layer, not a second shell — one canonical window manager.

```tsx
import {
    buildAppsFromManifest,
    buildDesktopChrome,
    type RealmManifestEntry,
    type RealmSurfaceBinding,
} from '@splicewire/beam-ux/shell';

// The host owns the realm-key → surface binding map (the one place a realm couples to a component).
const surfaceMap: Record<string, RealmSurfaceBinding> = {
    site: { label: 'Site', route: '/', subtitle: 'Public · marketing', accent: '#FF5B3A', geometry: {…}, render: () => <SiteWindow /> },
};

// manifest (server) → generic DesktopApp[] the realm-agnostic chrome reads.
const apps = buildAppsFromManifest(manifest, { surfaceMap, exclude, genericBinding, surfaceInjection });
const osInjection = buildDesktopChrome({ apps, brand: <Wordmark />, status: <Clock />, onNavigate, persist });
```

### API

- `buildAppsFromManifest(manifest, { surfaceMap, exclude?, genericBinding, surfaceInjection })` — the
  realm-aware seam. DATA from the manifest, COMPONENTS from `surfaceMap` (with a `genericBinding`
  auto-surface fallback for unmapped keys), GATING off each entry's `locked`/`upsell`. Returns a flat
  `DesktopApp[]`; an empty manifest → `[]` (empty dock, never a crash).
- `RealmManifestEntry` / `RealmSurfaceBinding` — the manifest-side types. They live **only here**; no
  manifest type crosses into the `@schemastud/mainframe/os` chrome tier.
- Re-exported canonical chrome + window manager: `buildDesktopChrome`, `Dock`, `Launcher`, `Clock`,
  `UpsellPopover`, `WorkspacePersistence`, `OperatorOverlay`, `useWindowManager` — see
  `@schemastud/mainframe/os`.

### Theming

The chrome bakes in **no** palette, fonts, or wordmark — it is structural class names (`os-*`, `op-*`)
+ the `--shell-*` token contract. The Analog-Studio ember look is applied host-side — see audiostud's
dev `/os` route for a full worked example. A second host restyles the same structure with its own tokens.

### Optional Inertia desktop adapter

`DefaultOsDesktop` and `DefaultOsDesktopProps` are exported by `@splicewire/beam-inertia`.
Move those imports from `@splicewire/beam-ux/shell` to the Inertia adapter package; mounting
`<DefaultOsDesktop />` there retains its zero-prop server-manifest and navigation behavior.
The default host `/os` and operator overlay continue to use the existing Beam Inertia page map.

The portable `defaultGenericBinding` and `defaultSurfaceInjection` helpers remain in this subpath.
`defaultSurfaceInjection(title, route, render, linkComponent?)` uses a native anchor for its error
fallback by default. Existing direct consumers needing Inertia SPA navigation pass Inertia's `Link`
as the fourth argument. The desktop adapter supplies it automatically.
