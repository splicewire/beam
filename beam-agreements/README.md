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

## A locked action asks for agreement, then continues

Bind it once, into each realm's frame kit, and mount the dialog once:

```tsx
import { AgreementStepUp, createAgreementInterlock, createStepUp } from '@splicewire/beam-agreements';

const stepUp = createStepUp();

beamInertiaOptions({
    // …
    frameKit: ({ transport, abilities }) => {
        const agreements = createAgreementInterlock({ transport, abilities, stepUp });
        return { transport: agreements.transport, actionLock: agreements.actionLock };
    },
});

// Anywhere, once: it renders nothing until asked.
createRoot(document.body.appendChild(document.createElement('div'))).render(<AgreementStepUp controller={stepUp} />);
```

- **Locked before the click.** An action whose `requires` names an Agreement that the page's ability map reports unmet
  (`agreement:{key}` false) is drawn locked by frame (`actionLock`, `@schemastud/frame` with agreements 06). Unlocking
  shows the version in force and accepts that version's digest, then the action's own form or confirmation runs.
- **A 428 the client didn't foresee.** The wrapped transport shows each outstanding Agreement's title and full frozen
  text, and only when the text's digest is the refusal's. On a mismatch it replays once for a fresh refusal, then
  errors. Accept calls the accept operation (or adds the agreement member to the input member the refusal names) and
  replays the original request once. A second 428 is an error, never retried. Declining performs and records nothing.
- The 428 dialog reads Agreements through frame's transport (`get('agreements', key)`). The registered
  `agreement-member` form widget reads its agreement through the REST `readUrl` (or the standard
  `/beam/agreements/agreements/{key}` route) with same-origin credentials, and submits only the digest of the exact
  text it displayed. Agreements are accepted through the `agreements` resource's declared `accept` action.
- The dialog is a modal `role="dialog"` named by its title and described by the text. Focus starts on the text, Tab
  stays inside, Escape declines, and focus returns to where it was.

## An ordinary route requires an agreement (the prompt page)

beam's route middleware (`->middleware('agreement:terms')`, agreements 07) sends a refused PAGE visit to the seam's
prompt, `agreements/required`. Merge this package's page into your Inertia page map:

```tsx
import { beamAgreementsPages } from '@splicewire/beam-agreements';

beamInertiaOptions({ pages: { ...beamAgreementsPages, ...pages } });
```

The page is 06's step-up: the same dialog and controller. The server sends each Agreement's text only when the version
in force still has the refusal's digest; a moved one shows "try again" instead. Accepting goes on to the intended URL,
and declining stays on the page with "Go back" and "Review again".

## Tests

`pnpm test` runs the screens over frame's memory transport (`@schemastud/frame/testing`) with fixture rows and a fixture
manifest; `pnpm typecheck` checks them.
