# @splicewire/beam-mdx

## 1.0.0

### Minor Changes

- 10a105b: **Breaking:** the raw-file save/load transport retires — `loadRawMdx`, `saveMdx`, `putMdx` and their `MdxLoader` /
  `MdxSaver` types (laravel-beam-ux ADR-0233 decision 10). They read and wrote a content name's raw `.mdx` through a host's
  `/beam/content` route, which `splicewire/laravel-beam-mdx` no longer ships; an MDX page is written through the entry
  operations like any other page. `parseFrontmatter`, `serializeMdx` and `serializeFrontmatter` stay.
- bf24f26: The frontmatter readers accept both key spellings (ux-0233 d9): `contentNavNodes`, `createContent` and the
  `beamMdxContent` draft gate read `nav_order`, `date_published` and the rest beside `navOrder` and `datePublished`, so a
  converted file (whose unclaimed keys laravel-beam-ux prints in snake case) reads as an unconverted one does. A camelCase
  key a file writes itself wins. `camelKeys` is exported for a host's own frontmatter readers.
- 08f69bb: Add `@splicewire/beam-mdx/lens`, the MDX Lens (ux-0233 d2, editor-parity EP-25).

  - `readMdx` reads an MDX page body into the same JsonDoc the TSX Lens produces. Markdown reads as the HTML profile's nodes, and JSX as components whose attributes go through the TSX Lens. Comments, other expressions and spread tags become Opaque Islands.
  - `printMdx` prints canonical MDX, one line per paragraph, and reaches a fixed point.
  - `@splicewire/beam-ux/jsondoc` exports `jsxAttributes`, so both printers write a tag's attributes and lens-owned fields identically.

- 10dc068: `readMdx` gives `metaData`: the value of `export const meta = {…}` when every part of it is a literal (strings, numbers,
  booleans, null, arrays and objects of them), so a host's MDX conversion can write it as frontmatter (ux-0233 d9). It is
  null when there is no meta, or when only running code could give its value; `meta` keeps the statement's source either way.

### Patch Changes

- 1e54793: The first, non-breaking step of retiring the MDX island and editor (ux-0233, editor-parity EP-26 G1). The rest goes as each host converts (EP-42).

  - `CanvasConfig.MdxView` / `MdxEdit` are optional and `@deprecated`. Without them, an `Mdx` node shows its MDX text read-only on the page and in the canvas, and the insert palette offers no new `Mdx` node.
  - The packaged canvas config no longer passes the starter stubs, and the stub `MdxView`/`MdxEdit` exports are removed from `@splicewire/beam-ux/editor` and beam-inertia. No consumer in the estate imports them; audiostud ships its own island.
  - `MdxDocumentEditor` and `KIT_MANIFEST` are `@deprecated`. The kit is declared on the server (`MdxKitNodeSource`), and MDX pages are edited as blocks.

- Updated dependencies [15c58c3]
- Updated dependencies [4c12998]
- Updated dependencies [ad864c9]
- Updated dependencies [3cd0a8c]
- Updated dependencies [3f000f0]
- Updated dependencies [5f6b1de]
- Updated dependencies [9af7d51]
- Updated dependencies [08f69bb]
- Updated dependencies [ecb80f0]
- Updated dependencies [e024aa9]
- Updated dependencies [22a1dbd]
- Updated dependencies [cbc1dd7]
- Updated dependencies [0a3c23b]
- Updated dependencies [aff425e]
- Updated dependencies [a8a03a0]
- Updated dependencies [144ad9a]
- Updated dependencies [8e03ab7]
- Updated dependencies [7d1826a]
- Updated dependencies [12fb9ac]
- Updated dependencies [f312863]
- Updated dependencies [1e54793]
- Updated dependencies [aef0699]
  - @splicewire/beam-ux@0.8.0

## 0.1.0

### Minor Changes

- 4e44bf0: Publish the initial Beam MDX package: file-driven content resolution and draft exclusion, the guide component kit, runtime and citation surfaces, and the separately loaded authoring editor.
