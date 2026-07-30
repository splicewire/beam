# @splicewire/beam-ux-prototype

The repo-agnostic runtime for the **rushing-prototype** UX-prototyping system (Beam free-tier arm;
ADR-0116 rehome-ui). Prototype UX in any React+Vite host the way splicewire does: real `@/`
components rendered **read-only over colocated fixtures**, auto-mounted at `/_prototype/<slug>`,
browseable via a gallery, and fenced from production by a build-time boundary assertion.

The one **load-bearing seam** — `import.meta.glob('../_prototype/**/*.tsx')`, a Vite compile-time
macro — stays at the host call site and **cannot** live in this package. Everything around it (the
discovery filter, the slug parse, the lazy resolve, the generic chrome, the boundary CLI) is
packaged so it stops being copy-pasted runtime that drifts per repo.

## Install

```jsonc
// host package.json
"@splicewire/beam-ux-prototype": "^0.1.0"
```

Peer deps (host-provided, single-instance): `react`, `react-router`, `lucide-react`, and the
`@schemastud/ui` shadcn foundation.

## `createPrototypeRoutes(glob, opts?)`

Wire the auto-discovery into your router. The host writes the glob (it must stay at the call site)
and keeps the `import.meta.env.DEV` guard so the whole branch tree-shakes out of production:

```tsx
import { createPrototypeRoutes } from '@splicewire/beam-ux-prototype';

export const router = createBrowserRouter([
    ...(import.meta.env.DEV
        ? createPrototypeRoutes(
              import.meta.glob<Record<string, unknown>>('../_prototype/**/*.tsx'),
          )
        : []),
    // …the app's real routes
]);
```

- Discovers every `_prototype/**/*.tsx`, skipping `_`-prefixed subdirs (`_chrome`, `_fixtures`).
- Route slug = filename minus `.tsx` minus an optional `ar`/ticket-number prefix — so a file moving
  into a per-effort subdir keeps its URL.
- Each module must export a `*Prototype` component (or a `default`).
- `opts.namespace` defaults to `/_prototype`.

## Injection contract

| What | Who provides it | Notes |
| --- | --- | --- |
| the glob result | **host** (required) | Vite macro; must stay at the call site |
| `react` / `react-router` / `lucide-react` / `@schemastud/ui` | host peer deps | single-instance |
| `cn` | bundled default, overridable | dependency-free; pass your own for Tailwind conflict de-dup |

A `lint:imports` deny-list gate (`npm run lint:imports`) guarantees no `@/` app-local import leaks
back into the package.

> More chrome (`Gallery`, `VariantBar`, `SettingsFrame`, `PrototypeDesk`) and the
> `verify-prototype-boundary` CLI land in subsequent tickets of the extraction; this README grows
> with them.
