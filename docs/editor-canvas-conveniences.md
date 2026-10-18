# Canvas conveniences (EP-13)

The package owns block clipboard, sibling wrap/unwrap, multi-selection style edits,
and the JsonDoc outline. Frame still owns the active node; the canvas selection
context adds a set without changing Frame's API. Ctrl/Command/Shift-click toggles
membership. A structural command clears selection rather than leaving stale paths.

Copy and Cut use a versioned `beam-blocks` JSON clipboard envelope. Paste inserts
into the selected editable container, or appends to the document with no selection.
New copies recursively receive UUIDv7 block ids (ux-0228 d3); text and opaque nodes
do not acquire ids. Moving or unwrapping a block preserves its identity. A delayed
clipboard operation refuses if the document changes or the editor becomes read-only;
Cut never deletes before clipboard success. Native text-field clipboard remains native.

Paste preflights the target's existing Manifest Profile: declared nodes, containment,
code admission, literal attributes through the existing AJV validator, and Block Style
through the existing compiler. No second vocabulary is declared. Dynamic attributes
remain opaque. The server's save admission remains authoritative. Hosts using the
legacy profile-less canvas retain that API; there is no invented client profile.

Wrap accepts contiguous sibling blocks and creates an admitted `div` with flex or
grid Block Style. Unwrap preserves its children. Batch style edits change only the
chosen declaration in the selected layer and emit one document update, so the host's
Local Session records one undo step. Components without root-style forwarding do not
gain style panels. The outline does not expose sealed component/gated descendants.

## Hide affects published styles

The editor-parity gap matrix `07-gap-matrix.md:200`, LY-02, explicitly specifies
`display: none` in a Block Style layer, per breakpoint, toggled from the outline.
Beam JS ADR-0003 specifies that those styles compile into the rendered entry's CSS,
with mobile-first min-width breakpoints. Hide therefore writes a draft visitor style,
effective when published. It is not an editor-only visibility flag.

Hide writes `display: none` in the selected breakpoint's default state. Show clears
that layer's override. It does not invent a display value to counter an inherited
hidden layer: the outline labels inherited hiding and the author edits the earlier
layer. Outline and inspector identify the visitor impact and `md+` (or base) scope.
Canvas width remains a layout preview; it does not simulate viewport media queries.

No PHP, profile metadata, history storage, manifest, lock, or release policy changes.
