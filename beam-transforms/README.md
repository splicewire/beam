# @splicewire/beam-transforms

The **transforms-domain** beam surface (popcorn-runner-substrate ticket 09; ADR-0116 rehome-ui +
ADR-0141): the **RunnerTransform authoring editor** for sandboxed, user-authored transforms of another
tool — the "make.com of CMSes" seam.

Authored **pre-packaged and DTO-first**. It owns its react-query data logic, types off the
`RunnerTransform` wire shape, imports only the `@schemastud/ui` foundation (never an app-local `@/`
path), and takes its transport + feedback as **injected services**. A host renders it by supplying one
adapter through `<TransformsProvider>`.

```tsx
import { RunnerTransformEditor, TransformsProvider, type TransformsClient } from '@splicewire/beam-transforms';

const client: TransformsClient = {
    list: () => api.get(route('runner-transforms.index')).then((r) => r.data.data),
    create: (input) => api.post(route('runner-transforms.store'), input).then((r) => r.data.data),
    update: (id, input) => api.patch(route('runner-transforms.update', { id }), input).then((r) => r.data.data),
    remove: (id) => api.delete(route('runner-transforms.destroy', { id })).then(() => {}),
    test: (id, input) => api.post(route('runner-transforms.test', { id }), { input }).then((r) => r.data.data),
};

<TransformsProvider services={{ client, notify }}>
    <RunnerTransformEditor />
</TransformsProvider>;
```

## The four-kind injection contract (ADR-0116)

1. **client** — the transport adapter (required, tenant-blind, endpoints relative — the host binds route names).
2. **notify** — feedback sink (optional; a dependency-free console default applies — no bundled toaster).
3. **onError** — mutation-error hook (optional; the rejection still propagates).
4. **renderHeaderExtra** — a host-chrome render slot in the editor header (optional).

The component holds **no tenant concept** — scoping is the adapter's job.

## Surface

The editor pairs a transform library (left) with an authoring pane: a **runtime picker** (the runtime
pick *is* the substrate pick — javy/python-wasi → wasm, node/python → bubble), a code editor, the
**requested-vs-effective grant readout** (deny-by-default; denied axes shown), a **trust chip** that
flips the primary CTA to "Request review & save" for `net:open` / `platform` publishing, and a live
**test panel** rendering the total Result (outcome + output + stderr + telemetry).

## Verification bar

- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint:imports` — the deny-list gate (no `@/`, no `sonner`, no `axios`, no `ziggy-js`, no Inertia).
- `npm test` — the isolation-mount vitest (mounts off a pure fixture provider, no Laravel).
- `npm run build` — `tsup` (ESM + `.d.ts`).
- `*.stories.tsx` — the colocated Storybook catalog (states axis).
