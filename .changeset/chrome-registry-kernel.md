---
"@splicewire/beam-ux": minor
---

The chrome registry (`@splicewire/beam-ux/docs`) is two `@schemastud/registry` registries, rooted at `beam.ux.chrome.layouts` and `beam.ux.chrome.templates` (registry-kernel-ts 07). Every existing export keeps its name, signature and behaviour. A duplicate name is declared Supersede, which is what the map did. Added: an optional last `by` argument on `registerLayout`, `registerTemplate` and `registerChrome`; `layoutRegistrant(name)` and `templateRegistrant(name)`; `chromeRegistries()`; `CHROME_LAYOUTS_ROOT` and `CHROME_TEMPLATES_ROOT`. `@schemastud/registry` is a new peer dependency.
