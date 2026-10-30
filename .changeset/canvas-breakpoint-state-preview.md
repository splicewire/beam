---
"@splicewire/beam-ux": minor
---

The editor canvas previews Block Styles at the selected breakpoint and state. Breakpoint layers answer to the canvas's own `beam-canvas` container instead of the author's viewport, and the inspector's selected state (for example hover) applies as if active. `compileBlockStyle` and `compileEntryStyles` take an optional `preview` (`{ container, state }`); without it their output is unchanged, so published pages keep `@media` and real states with the same class names.
