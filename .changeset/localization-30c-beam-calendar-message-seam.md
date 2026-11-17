---
"@splicewire/beam-calendar": minor
---

Localization 30 part C: beam-calendar gains a message seam. It ships `./messages` (`messages.default.json`, the `splicewire-beam-calendar::messages.*` catalog) and declares it with the `schemastud.messages` marker, and `@schemastud/messages ^0.1.0` becomes a required peer. The calendar item editor (CalendarCellForm) and the calendar chrome (the event badge's status and series labels, the filters) render through the reader's catalog and switch locale live; a validation error is kept as a key, so it re-renders in the new locale. English output is unchanged. A status the server projects that the package does not declare still renders humanized, as given, and a server or client failure message renders as it arrived. Its index exports nothing new.
