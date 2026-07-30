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

## `verify-prototype-boundary` (CLI)

Turns "prototypes never ship" into a build-time **assertion**: it runs the host's production build
and fails if any prototype code (or a `/_prototype/` route string) survived the DEV-guard
tree-shake. Wire it as the host's boundary script:

```jsonc
// host package.json
"scripts": { "verify:prod-boundary": "verify-prototype-boundary" },
"prototype": { "outDir": "../public/ui" }  // build output the CLI scans
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--out-dir <path>` | `prototype.outDir` in host `package.json` | build output dir to scan (relative to cwd) |
| `--tokens <a,b>` | `/_prototype/,_prototype` | comma-separated forbidden tokens |
| `--build-command <cmd>` | `npm run build` | the host build to run first |
| `--no-build` | (off) | skip the build; assert against an existing `--out-dir` |

Run it from the host UI package root; paths resolve relative to that cwd.

## Co-dev install note

This app consumes the package as a `file:` link inside an **npm workspace** (the repo root is the
workspace root). Always run `npm install` at the **workspace root**, never inside a member like
`ui/` — a member-level install mis-resolves hoisted transitive deps (e.g. duplicates
`prosemirror-view` across the co-dev tree) and can leave a `tsc -b` type clash in unrelated files.

> More chrome (`Gallery`, `VariantBar`, `SettingsFrame`, `PrototypeDesk`) lands in subsequent
> tickets of the extraction; this README grows with them.
