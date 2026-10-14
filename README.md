# @splicewire/beam-market

The marketplace-domain [beam](https://github.com/splicewire/beam) surfaces, authored **pre-packaged
and DTO-first** (rehome-ui / ADR-0116). Mirrors the PHP `splicewire/laravel-beam-market` package by
domain — born as its lazy JS twin (ticket 08, the first surface off this domain).

Ships the beam-core **Extensions area**: a unified `/extensions` catalog covering both listing
kinds (Scaffold Pack export, Beam Extension) plus Platform Tier listings (Satellite/Tower, their
own Browse section), a package-manager-style **Installed tab** with real inline Update/Remove
actions, and `requires_splicewire` gating with an area-wide disconnected promo banner. It owns its
react-query data logic and presentation; the host supplies **one transport adapter** (plus optional
feedback and the "Connect Splicewire" host-chrome slot) through `<ExtensionsProvider>`. It is typed
off the generated `ExtensionListingSummaryData` / `InstalledExtensionData` / etc. projection
delivered via `@splicewire/_resources`, so the PHP source of truth travels into the package as a
real build dependency.

```tsx
import { ExtensionsArea, ExtensionsProvider, type ExtensionsClient } from '@splicewire/beam-market';

const client: ExtensionsClient = {
    getCatalog: (filters) => api.get(route('beam-market.extensions.index'), { params: filters }).then((r) => r.data),
    getListing: (id) => api.get(route('beam-market.extensions.show', id)).then((r) => r.data),
    getInstalled: () => api.get(route('beam-market.extensions.installed.index')).then((r) => r.data),
    install: (id) => api.post(route('beam-market.extensions.install', id)).then((r) => r.data),
    update: (installId) => api.patch(route('beam-market.extensions.installed.update', installId)).then((r) => r.data),
    remove: (installId) => api.delete(route('beam-market.extensions.installed.destroy', installId)),
};

<ExtensionsProvider
    services={{
        client,
        notify: (e) => toast[e.type](e.message),
        // The host-chrome render slot for the "requires_splicewire" gated CTA (kind 3) — the
        // actual connect flow is host-specific.
        connectUrl: '/settings/splicewire',
    }}
>
    <ExtensionsArea />
</ExtensionsProvider>;
```

## The injection contract (ADR-0116)

- **kind 1 — `client`** (required): the transport adapter, pointed at
  `beam-market/extensions/*` endpoints (`Splicewire\Beam\Market\Http\Controllers\*`, registered by
  `BeamMarketServiceProvider` with zero host route-file edits). The component is host- and
  URL-blind.
- **kind 2 — `notify` / `onError`**: feedback + mutation-error hooks. Dependency-free console
  defaults apply when omitted (no bundled toaster).
- **kind 3 — `renderConnectCta` / `connectUrl`**: the "Connect Splicewire to install" host-chrome
  render slot the disconnected banner and detail-sheet gating notice invoke — a rendered host
  affordance the package can't own. A dependency-free default (a plain link) applies when the host
  supplies only `connectUrl`.
- There is deliberately **no real-time subscription kind (kind 4)** — this surface has no
  server→client streaming need; ADR-0116's four-kind vocabulary is used only where a genuine
  host-coupling need shows up, not applied wholesale to every surface.

Generic UI comes from the `@schemastud/ui` foundation; the DTO typing from `@splicewire/_resources`.

## Known gap (ticket 08)

`ProductInstall` (the backend's "installed" data source) carries no per-site scoping column yet —
ticket 09's manual-install-detection heartbeat is what adds real multi-site fan-out. Until then the
Installed tab reads the whole install-log table as a single self-hosted site's own local installed
set.
