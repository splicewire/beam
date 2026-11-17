---
"@splicewire/beam-accounts": minor
"@splicewire/beam-ux": minor
---

Localization 29: beam-accounts gains a message seam. It ships `./messages` (`messages.default.json`, the `splicewire-beam-accounts::messages.*` catalog) and declares it with the `schemastud.messages` marker, and `@schemastud/messages ^0.1.0` becomes a required peer. Every surface (the tokens roster and page, the team page, the auth forms, accept-invitation, passkeys, the account shell and nav) renders through the reader's catalog and switches locale live. English output is unchanged. New exports: `errorMessage(error, fallback, messages?)`, `NoticeError`, `Notice`, `useBeamAccountsMessages`, `englishBeamAccountsMessages` and the message types. A package-thrown error (such as a cancelled passkey ceremony) reaches the host's `onError` as a `NoticeError`, and `errorMessage(error, fallback, useBeamAccountsMessages())` renders it in the reader's locale. A host's own `navLabel`, `menuLabel`, `sectionLabels`, `title` and `label` still win over the catalog.

Localization 31 (beam-ux, no changeset at the time): beam-ux gains the same seam. It ships `./messages` (the `splicewire-beam-ux::messages.*` catalog) with the `schemastud.messages` marker and a required `@schemastud/messages ^0.1.0` peer. Every surface renders through the reader's catalog and switches locale live, with English unchanged. The 9 nodes the ratchet still counts are non-copy (accepted by root). Its index exports nothing new.
