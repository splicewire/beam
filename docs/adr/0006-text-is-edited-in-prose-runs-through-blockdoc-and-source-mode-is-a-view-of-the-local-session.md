# Text is edited in prose runs through blockdoc, and Source Mode is a view of the Local Session

Status: accepted
Date: 2026-10-16

An MDX page now holds blocks, as a `tsx` page does (`splicewire/laravel-beam-ux
docs/adr/0233-an-mdx-page-holds-blocks-and-mdx-is-only-its-file-language.md`). So one editor edits both: the canvas, with
one dock and one Local Session per entry. Text anywhere on the canvas is edited in **Prose Runs** through
`@schemastud/blockdoc`, and **Source Mode** shows the page as text in its File Language without leaving the Local
Session. Decided in editor-parity ticket 15 (splicewire-ecosystem `.scratch/splicewire/splicewire-ecosystem/editor-parity/`).

## Context

The canvas opens only `tsx` entries (`beam-ux/src/canvas/format.ts:18`, `CANVAS_FORMATS = ['tsx']`), and for anything
else it asks the author to edit the source file. ADR-0005 decision 3 left the MDX surface to ticket 15.

The canvas edits text only in a block whose children are all text (`blockdoc/json.ts:79-80`, `isLeafText`): it makes that
block `contentEditable` and saves its `textContent` when it loses focus (`canvas/CanvasNode.tsx:251`). A paragraph with
any bold, link or inline code can't be edited as one piece, and its plain stretches can't be edited at all. Measured
2026-10-16, 345 of the 659 paragraphs in 86 MDX files on disk carry inline formatting, and 756 of the 1,011 in 72 stored
bodies do. The leaf seam built to host a richer engine (`beam-ux/src/leaf/`) isn't wired into the canvas, and it works on
the old TSX tree rather than the JsonDoc.

`@splicewire/beam-mdx/editor`'s `MdxDocumentEditor` edits Markdown text through mdxeditor, so a node has no id that
survives an edit. `@schemastud/blockdoc` already compiles a Tiptap editor from a Block Manifest
(`react/manifest-extensions.ts:18-28`), gives every node a UUIDv7 id (`react/node-id-plugin.ts:5-10`), renders
components as node views that hold their children (`react/node-views.tsx:131-137`), and edits attributes in an inspector
(`react/node-views.tsx:168-175`). The owner's ruling (2026-10-14) was that blockdoc definitions should serve both the
WYSIWYG editor and the MDX editor.

## Decision

1. **The Body Kind chooses the surface.** The canvas opens every entry that holds blocks, MDX pages included, and the
   format gate becomes a body-kind check. This amends ADR-0005 decisions 1 and 3, where "the entry's format chooses the
   surface".
2. **The dock and the Local Session belong to the entry.** The kit mounts one dock (Save, Publish, History) around
   whatever surface the Body Kind picks, and the transport takes each kind's input.
3. **Text is edited in Prose Runs, through blockdoc, inside the canvas.**
   - **A run** is consecutive blocks of prose under one parent: paragraphs, headings, lists, quotes, code blocks, and the
     components whose category the profile allows among them, such as a callout or steps. A layout block ends a run and
     stays canvas-edited. A block that holds only text, such as a button's label, is a run of one. A table ends a run,
     and each of its cells is a run of one.
   - **Editing.** Clicking into a run's text opens it in blockdoc, compiled from the same Manifest Profile. Typing,
     Enter, Backspace, lists, marks, selection across blocks, paste and Markdown shortcuts are ProseMirror's. The
     canvas's Inspector edits whatever node is selected. An MDX page's body is usually one run.
   - **The model.** A mark in blockdoc is an inline block in the JsonDoc, and ids ride through both ways. blockdoc's own
     undo is off, so every edit is a Local Session step (ADR-0004).
   - **Loading.** `beam-ux` takes `@schemastud/blockdoc` as a dependency and loads it on the first text edit, ADR-0005
     decision 3's lazy branch, since every host's canvas edits text through it.
4. **Source Mode is a view of the Local Session.** Entering it prints the session's blocks in the page's File Language.
   Leaving it sends the text to the server's lens, which returns blocks with ids reattached against what was printed,
   and the change is one undo step. Save stays the only Save, and text not yet applied survives a reload with the
   session. It needs two read-only operations, print and read-without-saving, and it works for `tsx` pages through the
   TSX Lens. beam-docs-satellite ticket 64's text surface serves it, and a lazily loaded code editor can come later. A
   Hosted site's pages have no Source Mode.
5. **What retires.**
   - `MdxDocumentEditor` and `@mdxeditor/editor`.
   - The canvas's plain `contentEditable`, and the unwired leaf seam.
   - The canvas `Mdx` island: `CanvasConfig.MdxView` and `MdxEdit` (`canvas/context.tsx:13-35`), the "Content" template
     (`canvas/templates.ts:44`) and the starters' stubs (`beam-inertia/src/editor/mdx.tsx`).
   - The flagship's form-mode `UxBuilder` for MDX, and `useBuilderRegions`' choice of a form or a text box from
     `schema != null` (`~/Herd/splicewire-app/ui/src/features/studio/uxbuilder/useBuilderRegions.ts:93`).
6. **What carries over:** the kit's React components, the toolbar's insert and format actions (into blockdoc's toolbar
   and the palette), the prop forms (into the Inspector, read from the profile's schema), and `beam-content`'s node views.

## Considered options

- **Mount `MdxDocumentEditor` for MDX pages.** Its model is Markdown text, so ids, Block Styles and bindings can't live
  in it, and it would be a second editor for one kind of body.
- **The canvas edits each text block alone, with an inline ProseMirror engine (the leaf seam).** Enter, Backspace,
  merging, lists and multi-paragraph paste would be rebuilt out of canvas operations: a document editor rebuilt by hand.
- **The whole canvas runs on blockdoc.** Dragging sections and editing grids would live inside a text editor's model.
- **Source Mode as a separate save path,** needing a clean session as Restore does. Nothing could be undone across the
  switch, and an entry would have two Saves.

## Consequences

- **blockdoc's node names follow `splicewire/laravel-beam-ux` ADR-0228 decision 6:** a node's name is its JSX tag. Its
  base manifest (`paragraph`, `bullet_list`, …) is renamed, and the rich-content slots Tower has stored migrate with it.
- **The leaf seam's `mdxLeafEngine` and `registerLeafEngine` retire unused.** A component that wants a richer inline
  editor gets it from the profile, as a node view.
- **ADR-0004's Local Session holds text as well as blocks** while Source Mode is open. Its restore rule is unchanged.
- **The surface for source-kind entries is unchanged:** ticket 64's text surface.
