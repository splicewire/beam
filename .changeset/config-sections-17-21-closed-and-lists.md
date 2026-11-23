---
"@splicewire/beam-ux": minor
---

The Config area reads two new rules from laravel-beam's `beam-config` rows (config-sections 17 and 21).

- **Closed tiers (17).** A key the package closed to a tier (`ConfigKeyData.closed`) shows that tier in the Cascade inspector as a dashed "closed" row, in its place on the ladder and never as "not set". The inspector header also says "closed to …". The edit slot offers no edit to a realm whose tier is closed and says why. `canEdit` returns false for that realm, so it no longer offers a write the server refuses.
- **Lists are saved whole (21).** The edit slot for a list key says that saving replaces every item and that no tier can override one item, because an item's position moves whenever the list changes.

The new model helpers are `provenance`, `closedTiers`, `closedToRealm` and `isListKey`. There are five new message keys, `config_closed_to`, `config_standing_closed`, `config_closed_note`, `config_closed_reason` and `config_list_rule`, and the catalog has been regenerated.
