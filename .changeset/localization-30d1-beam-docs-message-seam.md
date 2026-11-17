---
"@splicewire/beam-docs": minor
---

Localization 30 part D1: beam-docs gains a message seam. It ships `./messages` (`messages.default.json`, the `splicewire-beam-docs::messages.*` catalog) and declares it with the `schemastud.messages` marker, and `@schemastud/messages ^0.1.0` becomes a required peer. The publishing panel and page, and the docs chrome (header, breadcrumb, rail, appearance toggle, product switcher, search, heading anchors, the API reference's registry link), render through the reader's catalog and switch locale live; the panel's errors and announcement are kept as keys, so they re-render in the new locale. A `DocsRequestError`'s `message` stays English. English output is unchanged, and the server's own values render as given. Its index exports nothing new.
