---
"@splicewire/beam-ux": minor
---

The chrome registry (`@splicewire/beam-ux/docs`) is two `@schemastud/registry` registries, rooted at `beam.ux.chrome.layouts` and `beam.ux.chrome.templates` (registry-kernel-ts 07). Every existing export keeps its name and signature, and answers as the two maps did for every string name: what resolves, what misses, and the names and order `registeredChromeNames()` lists. A duplicate name is declared Supersede, which is what `Map.set` did. Added: an optional last `by` argument on `registerLayout`, `registerTemplate` and `registerChrome`; `layoutRegistrant(name)` and `templateRegistrant(name)`; `CHROME_LAYOUTS_ROOT` and `CHROME_TEMPLATES_ROOT`. `@schemastud/registry` is a new peer dependency, needed at runtime by both `@splicewire/beam-ux/docs` and `@splicewire/beam-ux/pages`: a host that imports either must install it.
