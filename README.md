# beam

The `beam` **app-substrate** package family, as a single npm workspace.

Per ADR-0082's layering — *frame = editor/UI tooling; **beam = app substrate**; beam-\* =
capabilities* — this monorepo holds the implementation/app/site-level substrate, sitting **above**
the [`schemastud`](https://github.com/schemastud/js) core/tooling layer (`frame → beam` dependency
direction, never the reverse).

| Package | What it is |
| --- | --- |
| `@splicewire/beam-mdx` | File-driven MDX content rung (draft-exclusion Vite plugin, citation kit, `.site-prose`) |

Growing as FC mints `beam` / `beam-accounts` / `beam-notifications` / `beam-commerce`.

## Scope note

beam publishes under the **`@splicewire` npm scope** (so `@splicewire/beam-mdx` keeps its
name — the core/beam split is repo-level, not name-level). Two repos, one scope, one public
registry; no consumer breakage.

## Dev

```bash
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```

beam is a pnpm workspace (`pnpm-workspace.yaml`, leaves first). Its first-party dependencies link to their
checkouts: the beam packages here, and the `schemastud` and `splicewire/_resources` siblings beside this repo
(`~/Workspaces/js/packages`), through the root `pnpm.overrides`.

## Release

Public npm via Changesets (independent per package). On merge to `main`,
`.github/workflows/release.yml` opens a "Version Packages" PR; merging it publishes. Requires the
`NPM_TOKEN` repo secret (an npm automation token for the `schemastud` org).
