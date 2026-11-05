---
"@splicewire/beam-ux": minor
---

`tokens.css` themes scrollbars in app chrome: a `--beam-scrollbar-thumb` / `--beam-scrollbar-track` pair (the thumb a share of each container's own ink, the track transparent) and an `@layer base` rule that applies only in a document mounting a beam shell (`[data-beam-shell]`, now set by the desk, window and focus mainframes). Inner scroll containers take the colours and are thin; page scrollers (`<main>`, `[data-beam-scroller="page"]`, now set on the window and focus scrollers) keep the full-width bar, and the page's own bar stays the platform's. A component's `[scrollbar-width:none]` still wins. `tokens-docs.css` ships the tokens but not the rule.
