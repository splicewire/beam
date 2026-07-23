# @splicewire/beam-accounts

The accounts-domain [beam](https://github.com/splicewire/beam) surfaces, authored **pre-packaged
and DTO-first** (ADR-0092 vendor seam). Mirrors the PHP `splicewire/laravel-beam-accounts` package
by domain.

Customer-zero: the **API-keys / tokens** management surface — a portable, tenancy-agnostic
component. It owns its react-query data logic and presentation; the host supplies **one transport
adapter** (plus optional feedback and per-row chrome) through `<TokensProvider>`. It is typed off
the generated `ApiTokenData` projection delivered via `@splicewire/_resources`, so the PHP source of
truth travels into the package as a real build dependency.

```tsx
import { TokensProvider, TokensPage, type TokensClient } from '@splicewire/beam-accounts';

const client: TokensClient = {
    list: () => api.get('tokens').then((r) => r.data.data),
    create: (input) => api.post('tokens', toBody(input)).then((r) => r.data.data),
    // …renew / rotate / archive / remove / revokeOtherSessions / listPermissions
};

<TokensProvider
    services={{
        client, // required — the only thing the host must implement
        notify: (e) => toast[e.type](e.message), // optional; console default otherwise
        renderTokenActivity: (t) => <ActivityLog subjectId={t.id} />, // optional host chrome
    }}
>
    <TokensPage />
</TokensProvider>;
```

## The contract this honors (rehome-components §1–§8)

- **Injected transport** — no `@/lib/api`, no `axios`, no direct fetch. The adapter is the seam.
- **DTO-first typing** — `TokensClient<TToken = ApiTokenData>`; the default binds the generated
  projection, a divergent host may bind its own shape.
- **Injected feedback** — `notify` (console default), `onError` (host net); no bundled toaster.
- **Generic UI from the foundation** — `@schemastud/ui` (DataTable, shadcn primitives, `cn`), never
  app-local `@/components/*`.
- **Tenant-blind** — no tenant concept; scoping is the adapter's job (contract §7).
- **Skin = host tokens** — semantic Tailwind utilities resolve through the host theme. The host
  MUST `@source`-scan this package's `dist` (Tailwind v4) or the classes never emit.

`npm run lint:imports` enforces the deny-list; `npm test` mounts the surface off a pure DTO fixture
with no Laravel backend.
