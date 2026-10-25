---
'@splicewire/beam-ux': minor
'@splicewire/beam-inertia': patch
'@splicewire/beam-mdx': patch
---

The first, non-breaking step of retiring the MDX island and editor (ux-0233, editor-parity EP-26 G1). The rest goes as each host converts (EP-42).

- `CanvasConfig.MdxView` / `MdxEdit` are optional and `@deprecated`. Without them, an `Mdx` node shows its MDX text read-only on the page and in the canvas, and the insert palette offers no new `Mdx` node.
- The packaged canvas config no longer passes the starter stubs, and the stub `MdxView`/`MdxEdit` exports are removed from `@splicewire/beam-ux/editor` and beam-inertia. No consumer in the estate imports them; audiostud ships its own island.
- `MdxDocumentEditor` and `KIT_MANIFEST` are `@deprecated`. The kit is declared on the server (`MdxKitNodeSource`), and MDX pages are edited as blocks.
