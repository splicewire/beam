# @splicewire/beam-commerce

The commerce-domain [beam](https://github.com/splicewire/beam) surfaces, authored **pre-packaged
and DTO-first** (rehome-ui / ADR-0116; ADR-0092 vendor seam). Mirrors the PHP
`splicewire/laravel-beam-commerce` package by domain.

Customer-zero: the **prepaid-credit auto-reload** config + activity surface — a portable,
tenancy-agnostic component. It owns its react-query data logic and presentation; the host supplies
**one transport adapter** (plus optional feedback and the Stripe SetupIntent host slot) through
`<AutoReloadProvider>`. It is typed off the generated `AutoReloadConfigData` / `AutoReloadActivityData`
projection delivered via `@splicewire/_resources`, so the PHP source of truth travels into the
package as a real build dependency.

```tsx
import {
    AutoReloadProvider,
    AutoReloadConfigCard,
    ReloadActivityCard,
    useAutoReloadConfig,
    useAutoReloadActivity,
    type AutoReloadClient,
} from '@splicewire/beam-commerce';

const client: AutoReloadClient = {
    getConfig: () => api.get('studio/credits/auto-reload').then((r) => r.data.data),
    updateConfig: (body) => api.put('studio/credits/auto-reload', body).then((r) => r.data.data),
    getActivity: () => api.get('studio/credits/auto-reload/activity').then((r) => r.data.data),
};

<AutoReloadProvider
    services={{
        client,
        notify: (e) => toast[e.type](e.message),
        // The Stripe SetupIntent flow the package must not own — the host wires it here.
        onSavePaymentMethod: () => openStripeSetupIntent(),
    }}
>
    <AutoReloadConfigCard config={config} />
    <ReloadActivityCard activity={activity} />
</AutoReloadProvider>;
```

## The four-kind injection contract

- **kind 1 — `client`** (required): the transport adapter, pointed at the literal
  `studio/credits/auto-reload*` endpoints. The component is tenant- and URL-blind.
- **kind 2 — `notify` / `onError`**: feedback + mutation-error hooks. Dependency-free console
  defaults apply when omitted (no bundled toaster).
- **kind 3 — `onSavePaymentMethod`**: the Stripe SetupIntent (usage=off_session) host slot the
  "Save / Update card" affordances invoke. Omitted → a no-op. There is deliberately **no subscribe
  kind**.

Generic UI comes from the `@schemastud/ui` foundation; the DTO typing from `@splicewire/_resources`.
Frame `EditShell` / `SchemaForm` graduation is a deferred follow-up — this ships the hand-authored
injectable card.
