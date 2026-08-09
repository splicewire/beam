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
| `./puck` · `./blockdoc` · `./manifest` · `./leaf` | The Puck registry, the lossless `.tsx⟷AST` BlockDoc lens, manifest→config generation, the pluggable rich-text leaf. |
| `./blockdoc/json` | **Babel-free** JSON projection of BlockDoc — the visual-editor runtime shape (`JsonNode`) + immutable edit ops. Safe for the client bundle. |
| `./site` | Generic public-site chrome — `SiteLayout` + `SiteNav` (ticket 10). |
| `./account` | Generic authed-account chrome — `AccountShell` + `AccountNav` (ticket 13). |
| `./shell` | The **OS-shell layer** — `Shell` + the window-manager core (ticket 11). |

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

## `@splicewire/beam-ux/shell` — the OS-shell layer

A generic desktop chrome so a host mounts one component and gets a desktop of realms: a **menu bar**
(system/realm status), a **dock**, a **launcher** (start-menu), and a **window manager** (open /
focus / minimize / close), with a deliberate single-app **compact mode** on small screens. The
ticket-03 prototype (`.scratch/beam-ux-uplift/OS-SHELL-NOTES.md`) made real.

The shell owns the **frame**, the host owns the **content**: realm surfaces are framed through
HOST-INJECTED app renderers, never deep-routed from inside the package.

```tsx
import { Shell, type ShellApp, type ShellAutoPage } from '@splicewire/beam-ux/shell';

const apps: ShellApp[] = [
    { key: 'site',    title: 'Site',    realm: 'SITE',    subtitle: 'Public · marketing', accent: '#FF5B3A', render: () => <SiteWindow /> },
    { key: 'account', title: 'Account', realm: 'ACCOUNT', subtitle: 'Authed · library',   accent: '#E0A93C', render: () => <AccountWindow /> },
];

const autoSurfaced: ShellAutoPage[] = [
    { key: 'privacy', title: 'Privacy', route: '/privacy', render: () => <LegalWindow slug="privacy" /> },
];

<Shell apps={apps} autoSurfaced={autoSurfaced} brand={<Wordmark />} status={<Clock />} /* + theme hooks */ />;
```

### API

`<Shell>` props (all theming is host-supplied):

- `apps: ShellApp[]` — the launchable realm apps. Drives the **launcher grid** (data-driven, never
  hardcoded). Each `{ key, title, realm, route?, subtitle?, accent?, icon?, render() }`; `render` is
  the host-injected app renderer (a real component, an `<iframe>`, a Mainframe host — the host's
  call). The host builds this list, typically deriving it from its RealmRegistry / nav.
- `autoSurfaced?: ShellAutoPage[]` — realm-derived pages (e.g. legal `/privacy` · `/terms`) shown as
  their **own launcher tier** below the realm apps, each tagged `auto ✦ /path`.
- `brand?`, `menus?`, `status?` — menu-bar slots (wordmark, File/Realm/Window menus, right-pinned
  status).
- `desktopBackdrop?` — content shown on the empty desktop (wallmark/hint).
- `initialOpen?: string[]` — keys to open on mount (defaults to the first app; pass `[]` for none).
- `compactBreakpoint?: number` — the small-screen breakpoint (px, default 760). At/below it the shell
  drops to single-app compact mode.
- Theme hooks — `className`/`style` on the root plus `menuBar*`/`desktop*`/`window*`/`dock*`/
  `launcher*` class+style pairs, and `tileClassName`/`taskClassName`/`taskOpenClassName`. Every
  structural node carries a stable `data-shell-*` attribute (`data-shell-menubar`, `-window`,
  `-titlebar`, `-dock`, `-launcher`, `-app`, `-task`, …) and windows/tasks carry `data-realm` — so a
  host CSS layer / token set drives the entire look without the package shipping any palette.

The window-manager state core is exported separately for reuse/testing:
`useWindowManager()`, `windowManagerReducer`, `visibleWindows`, `isTaskOpen`.

### Theming

The package bakes in **no** palette, fonts, or wordmark. The Analog-Studio ember look (warm-charcoal
desktop, paper windows, ember cue, Fraunces/Geist/Geist-Mono, realm-hue glyphs) is applied
host-side via the `data-shell-*` selectors + the class/style hooks — see audiostud's dev `/os` route
for a full worked example. A second host restyles the same structure with its own tokens.
