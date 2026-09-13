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

## What ships today (slices 02–05 — the full component tree)

- **The generated Workflow\* projection**, re-exported off `@splicewire/_resources/types/workflows`
  (12 DTOs: lineage / version / blueprint / transition / catalog / guard-catalog-entry / coverage
  (+version) / projection / type-option / binding / principal-kind). The projection travels as a
  dependency edge — no bundling.
- **The editable blueprint aliases** (`BlueprintDraft`, `BlueprintTransition`, `GuardCatalogEntry`)
  and the shared `toDraft` normalizer in their own `blueprint.ts` module, so the logic modules +
  leaves type off the DTOs, not a component.
- **The zero-DOM logic modules**, moved byte-for-byte from the app twin:
  `principals`, `effectParams`, `workflowDelta`, `workflowLayout`, `migratePlan` — each with its
  co-located `*.test.ts`; plus `humanizeWorkflowKey` as its own pure module.
- **The injection seams** — `<WorkflowsProvider>` carrying `WorkflowsServices` (the injected
  `WorkflowsClient` over the 10 endpoints + `notify`/`onError` with a console default), and the
  `useWorkflowsServices` / `useNotify` hooks.
- **The read-only leaf surfaces** — `WorkflowGraph` (xyflow definition preview), `WorkflowDiff`
  (structural version diff), `RecipientPicker` (principals checklist).
- **The mid-tree surfaces** — `WorkflowEditor` (the schema-form authoring surface; renders guard/
  effect params off their catalog JSON schemas; no transport — takes an `onSave` callback) and
  `WorkflowMigrate` (the marking-migration wizard; dry-run + actuate route through the injected
  `client.migrate`).
- **The runtime Stepper** — `WorkflowStepperTrack` (the model-blind places track) and
  `WorkflowActions` (available-driven action buttons + per-transition confirm dialog + the injected
  real-time `subscribe` to `.status.emitted`).
- **The root** — `WorkflowsAdminPage`, composing Editor + Diff + Migrate over the injected client
  (react-query `queryFn`/`mutationFn` all route through `WorkflowsClient`).

The full tree mounts in isolation off pure generated-DTO fixtures (the §8a bar) — Admin renders
lineages, a save routes through the injected client, and the Stepper's `subscribe` adapter fires.

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

## Schedule a workflow transition

`WorkflowActionForm` extends the runtime workflow tools with a scheduled intent. Pass a generated
`WorkflowProjectionData`, optional subject label/picker, and an async `onSchedule` callback. The
callback receives local form selection `{ transition, dueAt, timezone }`; the host combines it with
its selected subject and the backend's declared calendar-action input. The component has no HTTP,
calendar-storage, composition or tenant dependency.

```tsx
<WorkflowActionForm
    projection={projection}
    subjectLabel={selectedSubject.title}
    onSchedule={async ({ transition, dueAt, timezone }) => {
        await scheduleSelectedSubject({ transition, dueAt, timezone });
    }}
/>
```

The selector includes every named transition in the definition, including transitions that may
become available later. It never substitutes scheduling for approval: authorization and workflow
checks still run on the server at execution. A rejected save retains the draft and displays the
error. Disable or replace a stale subject projection while the host loads another subject; key the
form by subject/action identity when switching drafts.

`workflowActionInstants(localTime, timezone)` resolves minute-precision wall time using the runtime's
IANA timezone data. Missing times are rejected; repeated times require an explicit occurrence
choice. The callback carries a UTC ISO instant and the original timezone. Ordinary calendar day
anchors are unaffected. The timezone data must be current on the browser and server.

The Storybook stories cover future transitions, missing/repeated hours and refused saves. Run the
package unit suite with `npm test --workspace @splicewire/beam-workflows`. For real Chromium checks,
start the repository Storybook with `npm run storybook -- --ci --no-open --port 6019`, then run
`node beam-workflows/scripts/verify-action-form.mjs` from the repository root. Set
`WORKFLOW_STORY_URL` for a different server and `WORKFLOW_SCREENSHOTS` to retain desktop/mobile
screenshots. This checks the portable form against synthetic fixtures; host API acceptance is a
separate integration gate.

`WorkflowActionDetail` consumes the public `CalendarActionRecordData` from
`@splicewire/beam-resources/types/calendar-actions`. It renders intended, started and completed
instants separately, keeps earlier attempt blockers visible after a retry, and labels application
only when the recorded outcome is applied. Hosts inject subject links, optional result rendering
and async cancel/retry callbacks. Supply rescheduling only for subject kinds the host can edit.
The host carries the displayed revision and retains a retry idempotency key through transport
failures. A missing callback leaves that operation unavailable; the server remains the authority.
The Chromium script also covers outcome history and retry-error recovery.
