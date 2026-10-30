# @splicewire/beam-commerce

## 1.0.0

### Minor Changes

- 0370f2e: Add the commerce-domain beam twin: the prepaid-credit auto-reload config + activity surface
  (`AutoReloadConfigCard`, `ReloadActivityCard`), promoted pre-packaged and DTO-first (rehome-ui /
  ADR-0116). Portable and tenancy-agnostic — the host injects one transport adapter plus optional
  feedback and the Stripe SetupIntent host slot via `<AutoReloadProvider>`; typed off the generated
  `AutoReloadConfigData` / `AutoReloadActivityData` projection delivered through `@splicewire/_resources`.
  Colocated Storybook stories + isolation-mount vitest + import-boundary lint.
- f950b7d: The billing surface's usage-by-model and bills tables, the credit ledger and the reload activity table stack on a phone through
  `@schemastud/ui`'s `DataTable` `stackOnMobile` mode, so no row's amount or status is clipped at 390px. **Peer:**
  `@schemastud/ui` `^0.1.2`, previously `*`.
- 8f937f3: Consume the bill-preview wire through the public camelCase fields `lineItems`, `totalUsd`, `hasActivePlan`, `componentType`, and `amountUsd`.
- 1f6dbbf: The credits and subscription surfaces report GA4 `begin_checkout` when a checkout starts (a hosted redirect waits for the report) and `purchase` for a captured direct reload, with its provider reference as the transaction id (EP-29). `@splicewire/beam-ux` becomes an optional peer dependency: without it, nothing is reported and nothing fails.

### Patch Changes

- ff2da6d: Replace implementation-oriented billing badges with customer-facing estimate freshness and coverage copy.
- 03b8c55: Add a custody-aware tenant Billing composition and embedded heading variants for its packaged money surfaces.
- 8e91170: Close `CreditEntryType` to exactly `'credit' | 'debit'` (ticket 00). The credit-ledger direction
  model previously shipped as an OPEN union (`'credit' | 'debit' | string`), so the trailing `string`
  silently absorbed any third kind. It is now closed — an unknown kind is a compile error, guarded by
  a `tsc`-level type test. `toCreditLedgerEntry` narrows the raw wire ledger (`CreditEntryData`, whose
  `type` stays bare `string`) at the surface boundary, mapping any value other than `'credit'` to
  `debit` (the same binary read the ledger badges already applied). No runtime behavior change.
- 0b9b4a3: Render an unsubscribed tenant's bill preview as a no-active-plan empty state instead of an error. The "Choose a plan" link appears only when the host passes `subscribeHref` (CommerceBillingPanel does when it renders its subscription section); `hasActivePlan` is optional, so older preview shapes keep rendering.
- 19e957c: Explain unavailable billing controls, fit the usage month picker on mobile, and distinguish prepaid credit from a spending cap.
- a25d3a4: Keep server and transport failures behind safe public copy, and present bill statuses, reload outcomes, and entitlement sources with declared human labels while retaining their exact keys.
- Updated dependencies [15c58c3]
- Updated dependencies [4c12998]
- Updated dependencies [ad864c9]
- Updated dependencies [3cd0a8c]
- Updated dependencies [3f000f0]
- Updated dependencies [5f6b1de]
- Updated dependencies [9af7d51]
- Updated dependencies [08f69bb]
- Updated dependencies [ecb80f0]
- Updated dependencies [e024aa9]
- Updated dependencies [22a1dbd]
- Updated dependencies [cbc1dd7]
- Updated dependencies [0a3c23b]
- Updated dependencies [aff425e]
- Updated dependencies [a8a03a0]
- Updated dependencies [144ad9a]
- Updated dependencies [8e03ab7]
- Updated dependencies [7d1826a]
- Updated dependencies [12fb9ac]
- Updated dependencies [f312863]
- Updated dependencies [1e54793]
- Updated dependencies [aef0699]
  - @splicewire/beam-ux@0.8.0
