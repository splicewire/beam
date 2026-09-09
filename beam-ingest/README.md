# @splicewire/beam-ingest

An accepted import run's progress, polling, terminal handling, and retry. The host provides a QueryClientProvider and IngestProvider with `services.client.get(id)` returning generated `IngestRunData`. Optional `notify({ type: 'finished', run })` fires once per run per mount; `onError(error)` observes failed status reads. Polling pauses on read errors until Retry and stops on completion or failure. Initial terminal runs do not fetch.

The host owns uploads, authentication, dialog/file-title/Close chrome, and invalidating its own resources from finished feedback. No upload/task-center surface or transport singleton ships here.

Types depend on the actual `@splicewire/_resources/types/ingest` projection. Generate that slice through the host resources pipeline before `typecheck` or `build`; do not substitute local DTO copies. Styling uses semantic classes from the host token layer; include this package's dist in the host Tailwind source scan. Colocated stories inherit the beam workbench's light/dark token decorator.

The beam workspace owns token conformance: run its existing `node scripts/lint-tokens.mjs` gate after adding this workspace. This package owns only its import-boundary gate; it does not duplicate token-lint logic.
