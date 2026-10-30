---
"@splicewire/beam-ux": minor
---

Remove the deprecated `onEditText` prop from `CanvasNode` and `CanvasSiblings` (`@splicewire/beam-ux/canvas`). Text leaves are edited through the prose seam (`onEditProse`), and the callback was no longer called; a caller still passing it now gets a type error instead of a silently ignored prop.
