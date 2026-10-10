---
'@splicewire/beam-inertia': patch
---

Frame icon map: key every icon name a family resource declares in kebab case (`receipt`,
`shield-check`, `mic`, …) so rail rows and cards draw their declared lucide glyph instead of the
fallback (`507f87c`, `203393a`). The published `0.1.3` dist has no icon map (`receipt` absent);
`renderLink` and `manifestLookup` were already in `0.1.3` (`d86e0cb` precedes the `dc5833d` bump).
