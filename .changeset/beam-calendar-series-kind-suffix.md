---
"@splicewire/beam-calendar": patch
---

Fix: a repeating Series can be created again (J3 "plan the calendar", launch-00 item 1). `CalendarCellForm` resolved the cell "kind" id with a `/`-only parse (`split('/')`, `endsWith('kind/…')`), but Tower emits DOTTED Kind ids (`kind.series`, `kind.composition-ref`) since registry-kernel 58 D4 — so the Series kind was never recognized on read (a stored series was misread as a one-off Release) nor resolved on write (the form posted the bare `series`, which Tower rejected). One shared, separator-agnostic `kindSuffix` helper now drives BOTH the read (`initialKind`) and write (`kindId`) paths, accepting `/` and `.` alike, matching the host's `calendar/services.ts` `kindSegment`, so they can't drift onto one separator again. Legacy URL-style ids still read correctly.
