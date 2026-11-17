---
"@splicewire/beam-workflows": minor
---

Localization 30 part W1: beam-workflows gains a message seam. It ships `./messages` (`messages.default.json`, the `splicewire-beam-workflows::messages.*` catalog) and declares it with the `schemastud.messages` marker, and `@schemastud/messages ^0.1.0` becomes a required peer. The workflow editor, graph, stepper, version diff and marking migration render through the reader's catalog and switch locale live. `blockedHeadline(report, messages?)` takes the reader's messages (English without them) and reads its plural from the catalog. English output is unchanged, and workflow names, places, guards and effect labels render as given.
