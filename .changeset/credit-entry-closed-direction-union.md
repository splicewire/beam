---
'@splicewire/beam-commerce': patch
---

Close `CreditEntryType` to exactly `'credit' | 'debit'` (ticket 00). The credit-ledger direction
model previously shipped as an OPEN union (`'credit' | 'debit' | string`), so the trailing `string`
silently absorbed any third kind. It is now closed — an unknown kind is a compile error, guarded by
a `tsc`-level type test. `toCreditLedgerEntry` narrows the raw wire ledger (`CreditEntryData`, whose
`type` stays bare `string`) at the surface boundary, mapping any value other than `'credit'` to
`debit` (the same binary read the ledger badges already applied). No runtime behavior change.
