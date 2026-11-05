---
"@splicewire/beam-ux": minor
---

`tokens.css` themes scrollbars: a `--beam-scrollbar-thumb` / `--beam-scrollbar-track` pair (the thumb a share of each container's own ink, the track transparent) and an `@layer base` rule that colours every inner scroll container and thins all but `<main>`. The page's own bar stays the platform's. A component's `[scrollbar-width:none]` still wins.
