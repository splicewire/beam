---
"@splicewire/beam-accounts": patch
"@splicewire/beam-ux": patch
---

The published declarations of `useBeamAccountsMessages` and `useBeamUxMessages` no longer name the JSON catalog binding. `BeamAccountsMessages` and `BeamUxMessages` are spelled from each package's English messages object, so a consumer that type-checks libraries (`skipLibCheck: false`) no longer fails with TS2304 `Cannot find name 'catalog'`. The types are unchanged.
