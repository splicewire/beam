---
"@splicewire/beam-docs": patch
---

The docs rail's current row is readable (tutorial-dx 09, browser check). The marked row took the host sidebar's `bg-sidebar-accent`, a dark-sidebar token, under the docs ink at 1.06:1; it now takes an 8% wash of `--beam-fg` (falling back to `--beam-ink`), so it reads in either appearance.
