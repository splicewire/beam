# @splicewire/beam-versioning

The **version-history beam surface** — the record-agnostic UI extracted from the composition
`VersionsDrawer`, authored pre-packaged and DTO-first (ADR-0116; ADR-0092 vendor seam). Mirrors the
PHP `splicewire/laravel-beam-versioning` package by capability.

Any surface with a `Versionable` record behind it (compositions, embeds, …) mounts the same
component over its own `/{resource}/{id}/versions` endpoint.

## What ships

- **`VersionsPanel`** — batteries-included: wires the package's react-query hooks to the list +
  restore dialog + a "Save version" affordance. The one-line mount.
- **`VersionsList`** — the pure list (readable handle, HEAD badge, label, relative timestamp,
  optional per-row host chrome) with empty / loading / error states. No data logic.
- **`VersionRestoreDialog`** — confirm-before-restore; no `sonner`/toast baked in.
- **`relativeTime()`** — the compact "2m ago / 3h ago / 5d ago / short date" formatter.
- Hooks: `useVersions`, `useSaveVersion`, `useRestoreVersion`; `VersionsProvider`, `useNotify`.

## Injection contract (ADR-0116 four-kind)

Everything host-specific is injected through one `<VersionsProvider services={…}>`:

| Kind | Service | Required? |
| --- | --- | --- |
| **transport** | `client: VersionsClient` (`list` / `save` / `restore`) — the host's axios/fetch wrapper pointed at the record's versions endpoint | **required** |
| **feedback** | `notify` / `onError` — a dependency-free console `notify` applies when omitted | optional |
| **host-chrome** | `renderVersionMeta(version)` — a per-row slot for host cosmetics | optional |

The host owns the `QueryClient`; the component is record- and tenant-blind.

```tsx
<QueryClientProvider client={queryClient}>
  <VersionsProvider services={{ client: embedVersionsClient }}>
    <VersionsPanel disabled={!canManage} />
  </VersionsProvider>
</QueryClientProvider>
```

## Verify

```
npm run build        # tsup → dist (ESM + d.ts)
npm run typecheck    # tsc --noEmit
npm run test         # vitest — the isolation-mount bar (§8a)
npm run lint:imports # the import-boundary deny-list (§8b)
```

Colocated `*.stories.tsx` catalog the treatment axes (populated / restore / empty / loading /
error / view-only / multi-type) — the ADR-0116 §7 promotion bar. A component is not "promoted"
until storied.
