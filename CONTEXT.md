# Beam

The Beam app substrate: the npm workspace whose packages give every host the same editor, chrome and capability UI.

## Language

### Authoring editor

**Block Style**:
The look an author gives one block in the editor, held as layers of CSS declarations. It is what the style panels edit,
as distinct from a developer's classes on the same block (docs/adr/0003).
_Avoid_: inline style, style object, sx

**Style Layer**:
One slice of a Block Style that applies under a condition: the base layer always, a breakpoint layer from a minimum
width, a state layer while the element is hovered, focused or active.
_Avoid_: variant, modifier, override

**Working Head**:
The latest saved version of an entry: what its authors are editing. A draft is pending when it differs from the
Publication Pin.
_Avoid_: current version, latest, HEAD (alone)

**Publication Pin**:
The saved version of an entry that guests are served. Only Publish moves it. Save and Restore never do
(splicewire/laravel-beam-ux docs/adr/0225).
_Avoid_: live version, published flag, workflow marking

**Local Session**:
One author's in-browser state for one entry: the undo stack and any unsaved changes, built on a Working Head. Undo
walks it, and only a Save sends it to the server (docs/adr/0004).
_Avoid_: undo history, autosave, cache

**Release**:
A named set of entries, each with the saved version it will publish, that goes live together, now or at a scheduled
time. Publishing an entry on its own is a Release of one. A rollback is a new Release of the earlier versions
(splicewire/laravel-beam-ux docs/adr/0226).
_Avoid_: batch, changeset, commit, deployment

### Block documents

**Body Kind**:
What an entry's body is made of: blocks, source text, or a form of fields. The entry declares it; it is never guessed
from the data (splicewire/laravel-beam-ux docs/adr/0228).
_Avoid_: format (that is the file language), body shape

**JsonDoc**:
A page body as declared blocks: a tree of block, text and opaque nodes, where each block keeps its identity across
edits and carries its own Block Style. It is what a `tsx` page stores and what the canvas edits, and the server
writes it back as source.
_Avoid_: BlockDoc, BlockDoc JSON, body tree

**TSX Lens**:
The reading of a page's TSX source as a tree of blocks, lossless enough that an edit can be written back as source.
Source becomes a JsonDoc through it.
_Avoid_: BlockDoc (its retired name), blockdoc (that is a `@schemastud/blockdoc` document), parser

**Opaque Island**:
A piece of page source the TSX Lens can't break into blocks, such as a loop, a condition or an expression. It is
carried verbatim and edited only as source. A tenant's page has none.
_Avoid_: raw block, code block

**Block Manifest**:
The declared vocabulary of a block document: each node's name, its category, what it may contain and the schema of its
attributes (splicewire/splicewire-app docs/adr/0112). It is the one vocabulary for the canvas, the MDX component kit
and `@schemastud/blockdoc` documents. A component an author can place is a node in it.
_Avoid_: block schema, node registry, kit, component map

**Manifest Profile**:
The Block Manifest one kind of entry is edited against: the nodes an author may place there, and whether code is
admitted. The host declares one per realm, and the editor's palette, its inspector and a save all read the same one.
_Avoid_: palette, allow-list, kit
