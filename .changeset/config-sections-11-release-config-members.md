---
"@splicewire/beam-ux": minor
---

The Release panel shows config members (config-sections 11).

`ReleasePanel` groups a Release's members by kind — **Page / Theme / Other** (by the entry's type) and **Config** — and
renders each config member's section, package, version move, "reloads workers", and key diff
(Key → Published → After publishing → Set by → Applies). A secret shows its change word only, never a value; an
unreadable section shows a can't-read note; publishing shows the mirror files a central Release writes (or "database
history only" for a tenant Release) and a secrets note.

**Wire shape (mirrors laravel-beam-ux `ReleaseData` / `ReleaseChangesData`).** `ReleaseRecord.members[]` gains four
required fields — `kind`, `ref`, `label` and `entryType` (`UxType | null`) — and `entryId` becomes `string | null` (a
config member has none). New exported types `ReleaseConfigChanges` (the config slice of the `changes` op, not the whole
`ReleaseChangesData`), `ReleaseConfigChange` and `ReleaseConfigKeyChange`, and a new optional `changes` prop on
`ReleasePanel` whose `config` slice drives the config cards.

**Deploy order.** The PHP half must never deploy ahead of this JS. Land/release them together (one flagship pin bump) or
the JS first; this JS against the old PHP wire is safe (members without `kind` / `entryType` read as entries under
"Other"). PHP first is unsafe: the old panel keys members on `entryId`, which is now null for a config member.
