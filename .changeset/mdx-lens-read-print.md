---
'@splicewire/beam-mdx': minor
'@splicewire/beam-ux': patch
---

Add `@splicewire/beam-mdx/lens`, the MDX Lens (ux-0233 d2, editor-parity EP-25).

- `readMdx` reads an MDX page body into the same JsonDoc the TSX Lens produces. Markdown reads as the HTML profile's nodes, and JSX as components whose attributes go through the TSX Lens. Comments, other expressions and spread tags become Opaque Islands.
- `printMdx` prints canonical MDX, one line per paragraph, and reaches a fixed point.
- `@splicewire/beam-ux/jsondoc` exports `jsxAttributes`, so both printers write a tag's attributes and lens-owned fields identically.
