# @splicewire/beam-mainframe

## 0.2.0

### Minor Changes

- ad864c9: The Body Kind chooses the editor surface (beam JS ADR-0006 d1, editor-parity EP-26 D).

  - The canvas opens every entry the server declares `blocks`, MDX pages included on a host that holds MDX as blocks (ux-0233 d1). An entry that holds source (a host's unconverted MDX page, a Component entry) gets the stated refusal.
  - `canvasAccepts(entry)` replaces the format-only check. An entry without a `bodyKind` falls back to the format gate, so an older server is unchanged.
  - beam-mainframe's `EntryRef` and page context carry an optional `bodyKind`, also broadcast on `beam-ux:mode`. beam-inertia reads it from `props.entry.bodyKind`.
  - Source Mode labels its text with the entry's File Language: `MDX source` for an MDX page.
