---
"@splicewire/beam-ux": minor
"@splicewire/beam-resources": minor
---

The Config area binds to the Override Ladder (config-sections 10b).

`@splicewire/beam-resources` regenerates the `beam-config` slice, `types/config.d.ts`, after laravel-beam's tickets 05 and 07.
- It adds the rows' draft, override, pin and lock fields.
- It adds the op inputs: `ConfigSaveDraftInputData`, `ConfigRestoreInputData`, `ConfigLockInputData` and `ConfigSectionRefInputData`.

`@splicewire/beam-ux` gains the Config area's write half, exported from `@splicewire/beam-ux/config`.
- **`EditSlot`:** saves a draft `set`, `null` or inherit. Save stays disabled until the value is edited, so an untouched secret is never drafted to null.
- **`LockControl`:** the operator's lock and unlock for tenants.
- **`DraftBar`:** the key-level diff, publish and discard. It also offers "Add to the Release" when the host passes an open Release.
- **`VersionsPanel`:** lists the versions and restores one as the draft.
- **Binding helpers:** `useConfigValue` and `ConfigFields`, which read a section's resolved value in a host form.
- **Model helpers:** `sectionForRealm`, `draftFor`, `keyDiff`, `canEdit`, `allowsNull` and `toDraftValue`.

`ConfigArea` takes `realm` (`'operator' | 'tenant'`; the tenant realm shows no env name, file or layer source) and `release`.

`ConfigReleaseTarget` is `{ id, title, command }`. The host resolves the open Release and supplies the runner for its `command` op (beam-ux's Release command is not a frame action). The draft bar names the Release a section will join and confirms once joined, for that section and draft only: after a later Save draft it says the Release holds an earlier draft and offers to add it again (which re-pins the member). A refusal shows the server's message.

`ReleaseCommand` gains `kind`, matching ticket 08's `ReleaseCommandData`.
