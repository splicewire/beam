---
"@splicewire/beam-ux": major
"@splicewire/beam-accounts": minor
"@splicewire/beam-inertia": minor
---

Move AccountShell and its account data/nav exports from beam-ux/account to
beam-accounts/account. The old beam-ux/account entry is removed without an alias.
Update the Inertia adapter and story together; consumers must upgrade this release
set together. AppRail retains its default renderer and exposes router-neutral row
and group rendering seams for sidebar primitives. Account collapse, tooltips,
mobile disclosure, slots, prefetch and sidebar state remain host-controlled.
