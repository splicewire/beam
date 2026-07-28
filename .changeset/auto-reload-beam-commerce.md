---
'@splicewire/beam-commerce': minor
---

Add the commerce-domain beam twin: the prepaid-credit auto-reload config + activity surface
(`AutoReloadConfigCard`, `ReloadActivityCard`), promoted pre-packaged and DTO-first (rehome-ui /
ADR-0116). Portable and tenancy-agnostic — the host injects one transport adapter plus optional
feedback and the Stripe SetupIntent host slot via `<AutoReloadProvider>`; typed off the generated
`AutoReloadConfigData` / `AutoReloadActivityData` projection delivered through `@splicewire/_resources`.
Colocated Storybook stories + isolation-mount vitest + import-boundary lint.
