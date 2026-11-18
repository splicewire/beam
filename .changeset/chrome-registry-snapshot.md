---
"@splicewire/beam-ux": minor
---

`chromeRegistrySnapshot()` (`@splicewire/beam-ux/docs`) returns what the two chrome registries hold as plain data: each root, declaration, key and registrant, and the packaged builtin names (registry-kernel-ts 09). The new `beam-ux-chrome-snapshot` bin imports a host's chrome registration modules (`--register <module>`) and prints the snapshot, or writes it with `--write` to `storage/app/beam-chrome-registry.json` (`--out` to change it). `BeamUxChromeAudit` in `splicewire/laravel-beam-ux` reads that file in place of the hand-kept `beam.ux.chrome.registered` list. The built types still name no `@schemastud/registry` type: the snapshot's type is declared in this package.
