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

## Operator screens

- `OperatorRegistry` takes `agreements`, `versions`, `entries` and, optionally, `coverage`. It shows a read-only list
  of each, each with the facets bar of its declared filters, and each opening a record read-only. With `coverage`, it
  first draws that resource's summary.
- `PartyHistory` takes `resource` and `scope`, and shows one party's entries. `scope` is the request parameters your
  entries resource reads to narrow to one party, and this package passes them on unread:

  ```tsx
  <PartyHistory resource={entriesResourceKey} scope={{ [yourPartyParameter]: partyId }} />
  ```

- `CoverageCard` takes `resource` and draws that resource's `summary` through frame's `DashboardCard`, so the card is
  the resource's declared summary widget (`StatRow` by default) with the payload's own label and figures.

## Tests

`pnpm test` runs the screens over frame's memory transport (`@schemastud/frame/testing`) with fixture rows and a fixture
manifest; `pnpm typecheck` checks them.
