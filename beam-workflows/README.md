# @splicewire/beam-workflows

The workflows-domain [beam](https://github.com/splicewire/beam) surfaces, authored **pre-packaged
and DTO-first** (ADR-0092 vendor seam). Mirrors the PHP `splicewire/laravel-beam-workflows` package
by domain. The **second proof** of the rehome doctrine (after `beam-accounts`), and a stiffer one:
the JS twin is created from scratch, it carries a real-time subscription seam, a schema-driven
editor, and `@xyflow/react` as a heavy peer.

The surfaces own their react-query data logic and presentation; the host supplies **injected
services** (transport + real-time subscription + feedback + host chrome) through
`<WorkflowsProvider>`. They are typed off the generated `Workflow*Data` projection delivered via
`@splicewire/_resources`, so the PHP source of truth travels into the package as a real build
dependency (the `import type … from '@splicewire/_resources/types/workflows'` edge survives into
`dist/index.d.ts`).

## What ships today (slice 02 — the DTO-first foundation)

- **The generated Workflow\* projection**, re-exported off `@splicewire/_resources/types/workflows`
  (12 DTOs: lineage / version / blueprint / transition / catalog / guard-catalog-entry / coverage
  (+version) / projection / type-option / binding / principal-kind). The projection travels as a
  dependency edge — no bundling.
- **The editable blueprint aliases** (`BlueprintDraft`, `BlueprintTransition`, `GuardCatalogEntry`)
  in their own `blueprint.ts` module, so the logic modules type off the DTOs, not a component.
- **The zero-DOM logic modules**, moved byte-for-byte from the app twin:
  `principals`, `effectParams`, `workflowDelta`, `workflowLayout`, `migratePlan` — each with its
  co-located `*.test.ts`.
- **`humanizeWorkflowKey`**, extracted from the Stepper into its own pure module (so the editor
  imports the helper, not the real-time Stepper).

The provider, the injected `WorkflowsClient` / real-time `subscribe` seam, and the seven components
(`WorkflowsAdminPage`, `WorkflowEditor`, `WorkflowStepper`, `WorkflowMigrate`, `WorkflowDiff`,
`WorkflowGraph`, `RecipientPicker`) arrive in slices 03–05.

## The contract this honors (rehome-components §1–§8)

- **Injected transport** — no `@/lib/api`, no `axios`, no direct fetch. The adapter is the seam.
- **Injected real-time** — the Stepper's Laravel Echo `.status.emitted` subscription becomes an
  injected `subscribe(channel, event, cb) => unsubscribe` service (the 4th injection kind; host
  wires Echo, a non-Laravel host wires SSE/WS/no-op).
- **DTO-first typing** — camelCase DTOs mirror the camelCase wire (`config/data.php` maps input
  snake→camel, leaves output as-is), so the adapter passes JSON straight through with no mapping —
  the *opposite casing* of tokens' snake_case, the same "own the wire" rule.
- **Injected feedback** — `notify` (console default), `onError` (host net); no bundled toaster.
- **Generic UI from the foundation** — `@schemastud/ui` (shadcn primitives incl. the accreted
  `Switch` + `Card`, `cn`), never app-local `@/components/*`. `@xyflow/react` is a host-provided
  **peer**, not a foundation primitive (a heavy generic viz lib the host already carries).
- **Tenant-blind** — no tenant concept; scoping is the adapter's job (contract §7).
- **Skin = host tokens** — semantic Tailwind utilities resolve through the host theme. The host
  MUST `@source`-scan this package's `dist` (Tailwind v4) or the classes never emit.

`npm run lint:imports` enforces the deny-list; `npm test` runs the logic-module suites + the barrel
isolation bar off the pure DTO projection with no Laravel backend.
