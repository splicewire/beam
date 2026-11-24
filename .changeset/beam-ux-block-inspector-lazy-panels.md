---
"@splicewire/beam-ux": patch
---

The block inspector's style panels (Text, Layout, the other property groups, Gradient stops and Advanced) now render their controls only while the panel is open. A closed panel holds just its summary. When opened, a panel's controls read the block's current values. Text typed into a property field but not yet written is kept if the panel closes and reopens. Gradient stops and Advanced entries are also kept. Before this, every closed panel kept all its controls in the DOM: 220 of the inspector's 243. Every edit re-rendered all of them. A side effect is that the browser's find-in-page can no longer reach a field inside a closed panel. Open the panel first.
