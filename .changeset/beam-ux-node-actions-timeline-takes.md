---
"@splicewire/beam-ux": minor
---

Two new subpath exports: `@splicewire/beam-ux/timeline` (`TimelineWidget`, registered as `otio-timeline`, with `TimelinePortsProvider` and the OTIO reader `layoutTimeline`) and `@splicewire/beam-ux/takes` (`TakesStrip`, drawn from a host-mapped `StripTake` view model, and `relativeWhen`). The canvas grows one optional seam for refining a selected node: `UxBuilderClient.refineNode` on the entry client, and `VisualEditorProps.nodeAction`; supplied, the inspector shows a Refine control whose candidate is accepted as one Local Session step, and omitted, nothing changes. Their copy reads beam-ux's message catalog; `TakesStrip`'s `labels` still override its defaults.
