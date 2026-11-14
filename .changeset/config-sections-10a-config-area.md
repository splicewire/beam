---
"@splicewire/beam-ux": minor
"@splicewire/beam-resources": minor
---

`@splicewire/beam-resources` gains the generated `beam-config` slice, `types/config.d.ts` (`ConfigSectionData`, `ConfigKeyData`, `ConfigLayerData`, `ConfigEnvData`, `ConfigSectionFilesData`, `ConfigSectionCountsData`, and the `ConfigTier`, `ConfigEffect` and `ConfigMerge` enums), projected from `splicewire/laravel-beam` (ADR-0245 §8). `@splicewire/beam-ux` gains the `@splicewire/beam-ux/config` subpath: the Config area's read half over `beam-config` rows (config-sections 10a), with the all-sections index on frame's `ListShell`, the section rail, the key table (Key · Value · Set by · Fed by · Applies) and the Cascade inspector. Each key renders its deploy-only, reload, live or secret state, and a secret shows only whether it is set.
