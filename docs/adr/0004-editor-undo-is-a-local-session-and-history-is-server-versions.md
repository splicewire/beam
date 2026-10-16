# Editor undo is a Local Session; history is server versions

Status: accepted
Date: 2026-10-14

The authoring editor (`@splicewire/beam-ux` canvas) keeps two separate histories. **Undo and redo** (Ctrl-Z,
Shift-Ctrl-Z) walk a **Local Session**: the entry's in-browser undo stack plus any unsaved working copy, owned by the
package. **History** is the server's versions of the entry, shown in a History panel, which an author restores from
on purpose. A Save is the only thing that sends the Local Session to the server. Decided in editor-parity ticket 05
(splicewire-ecosystem `.scratch/splicewire/splicewire-ecosystem/editor-parity/`). The server half is
`splicewire/laravel-beam-ux docs/adr/0225-an-entry-has-one-history-a-save-is-a-draft-and-publish-moves-the-pin.md`.

## Why not undo over server versions

That's how the beam site does it today, through a host-injected `onUndo` that restores the previous version. Nothing
unsaved can be undone, and the first save can't be either. Every step is a round trip that mints a version, and each
restore bypassed the mirror, the compile and the pin (editor-parity ticket 03, F2). Claude Design's undo is
editor-local, and so is Webflow's, with versions kept as a separate list.

## The shape

- **One Local Session per entry.** It survives Save and Publish. Undoing past a Save leaves the working copy dirty
  again, and nothing reaches the server until the next Save.
- **It survives a reload.** It is stored in IndexedDB rather than `localStorage`, because bodies can exceed the latter's
  quota. The key is the entry id, the `headVersion` the session started from (its base) and the user.
- **The base is checked on load.** If the stored base matches the server's `headVersion`, the session resumes silently.
  If it doesn't, because someone else saved or the author saved in another tab, the editor asks "Restore unsaved
  changes / Discard". It never merges silently.
- **Save sends its base.** The server refuses a stale base with a conflict, and the author chooses between reloading
  theirs and saving theirs as a new version.
- **Restore needs a clean session.** Save or discard first. The stack then restarts from the restored body.
- **The package owns it**, so every host gets the same undo. The host-injected `onUndo`/`canUndo` props are no longer how
  undo reaches versions. The package still doesn't know about versions (ADR-0116's four-kind seam): a Local Session is
  editor state, and History goes through the transport's `versions` and `restore`.
- *Extended by ADR-0006 decisions 3 and 4 (2026-10-16): every text edit in a Prose Run is a step here, and while Source
  Mode is open the session holds its unapplied text, which survives a reload like any other change.*

## Considered and not taken

- **A stack shared by every entry open in the session**, as Claude Design's stack spans artboards. The editor edits
  one region or page at a time. This comes back if the multi-artboard canvas does.
- **A stack that flushes every step into a server version.** It floods History.
- **Caching the entry body in the query client and reading it first.** You would start editing a stale copy. A
  client-wide persister for read-mostly queries is a separate question, nominated to the client-codegen work, and it
  excludes the entry body.
