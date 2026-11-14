---
"@splicewire/beam-accounts": patch
"@splicewire/beam-inertia": patch
"@splicewire/beam-mainframe": patch
"@splicewire/beam-calendar": patch
"@splicewire/beam-ingest": patch
---

The workspace no longer resolves @schemastud/* or @splicewire/_resources from sibling checkouts; every package names
their releases. What changes for an installer:

- Peer ranges widened to admit the current releases (the old ranges still match): beam-accounts `@schemastud/ui`
  `^0.1.2 || ^0.2.0`; beam-inertia `@schemastud/frame` `^0.2.2 || ^0.5.0`, `@schemastud/mainframe` `0.1.0 || ^0.1.0`,
  `@schemastud/seam` `0.2.2 || ^0.4.0`, `@schemastud/ui` `^0.1.2 || ^0.2.0`.
- beam-mainframe's runtime `@schemastud/mainframe` is the release `github:schemastud/js#436d9db6…&path:/mainframe`
  (0.1.2) instead of `*`.
- beam-calendar's and beam-ingest's runtime `@splicewire/_resources` is the release
  `git+https://github.com/splicewire/_resources.git#33be024a…` (0.5.0). That repository is private: installing these
  packages needs GitHub access to it.
