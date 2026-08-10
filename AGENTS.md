> You are in **splicewire/beam** — the Beam app-substrate npm workspace (ADR-0082).

One git repo, one npm workspace — not one-repo-per-package like the rest of the fleet. Per
ADR-0082's layering (*frame = editor/UI tooling; **beam = app substrate**; beam-\* = capabilities*),
this holds the implementation/app/site-level substrate, sitting above the `schemastud/js` core/tooling
layer. For the current package roster, see the `workspaces` field in this repo's own `package.json`;
that's the source of truth, not this file. Publishes under the shared `@schemastud` npm scope,
independently versioned per package via Changesets.

## Vendored family-package conventions

Any repo that vendors another family repo's code (composer `vendor/<vendor>/<pkg>/`, npm
`node_modules/<vendor>/<pkg>/`) checks that vendored repo's own `AGENTS.md` for conventions it
ships with itself before editing through into it.

Two conventions specific to how this repo vendors `schemastud/js`:

- **Package paths are pinned.** Duplicated from `schemastud/js`'s own README: its packages are
  workspace roots at their existing top-level paths (not nested under `packages/*`), because the
  fleet — including this repo — consumes several of them via `file:` overlays pinned to those exact
  paths (`…/packages/schemastud/<pkg>`). Don't expect them to move.
- **`@schemastud/*` `file:` deps live in `devDependencies` only, never in `dependencies`.** The real
  published contract is declared via `peerDependencies: "*"` alongside it. npm never resolves
  `devDependencies` for a package installed *as a dependency* of something else, so these `file:`
  paths never leak into anything published — unlike a composer `composer.local.json` path-repo
  overlay (which does leak into `composer.lock` and needs `/composer-canonicalize`'s strip-and-relink
  pass before shipping), no equivalent canonicalize step exists or is needed here, by construction.
