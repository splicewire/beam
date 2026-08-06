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
| `./site` | Generic public-site chrome — `SiteLayout` + `SiteNav` (ticket 10). |
| `./account` | Generic authed-account chrome — `AccountShell` + `AccountNav` (ticket 13). |
| `./shell` | The **OS-shell layer** — `Shell` + the window-manager core (ticket 11). |

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
