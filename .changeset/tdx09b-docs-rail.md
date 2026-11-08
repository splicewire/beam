---
"@splicewire/beam-docs": patch
---

The docs rail marks the reader's current page and draws its group labels legibly (tutorial-dx 09b). A docs page's nav arrives without the server's `active` stamp, so the rail now marks the row whose `href` is the current URL when nothing in the rail is stamped; a server stamp, where present, stays the only one. The rail's group and zone labels, which are not links and so kept the host's `--sidebar-*` ink at 55% and 80%, now take `--beam-ink-70` like the rail's links.
