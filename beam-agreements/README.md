# @splicewire/beam-agreements

Agreements and consents in the browser: the screens a person and an operator read them through. The agreements
ledger itself is server-side (`splicewire/laravel-beam-agreements`).

## Screens

- `AgreementsAndConsents` lists a person's entries under their account and opens one.
- `OrganisationAgreements` gives an organisation's owner the same view of the entries made on its behalf.

Both render under your frame kit's provider and take the entries resource's key:

```tsx
const kit = createFrameKit({ transport });

<kit.Provider>
    <AgreementsAndConsents resource={entriesResourceKey} />
</kit.Provider>
```

They name no resource and no field. The columns, the detail's fields and the withdraw action are whatever the resource
declares in its manifest and schema. Withdraw is a declared record action (destructive, confirm-only), and frame draws,
confirms and sends it.

## Tests

`pnpm test` runs the screens over frame's memory transport (`@schemastud/frame/testing`) with fixture rows and a fixture
manifest; `pnpm typecheck` checks them.
