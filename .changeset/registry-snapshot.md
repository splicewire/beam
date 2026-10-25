---
'@splicewire/beam-inertia': minor
---

`registrySnapshot(registry?)` returns the sorted names of the components the canvas registers (EP-07, ux-0228 d6). By default that is beam-inertia's registry, gated by the configured auth features. A host writes the list to the path in `beam.ux.manifest.js_registry`, and `beam:doctor` compares it, both ways, with each realm's Manifest Profile. Without that file the doctor reports the check as inconclusive, never as a pass.
