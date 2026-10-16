# One editor: the host kit lives in beam-ux, and a host conforms by mounting it

Status: accepted
Date: 2026-10-14

The owner's ruling is that every host mounts the same authoring editor and starts from the same place, extending it
only through declared seams. The pieces a host mounts to get that editor, the **editor kit**, move from
`@splicewire/beam-inertia` into `@splicewire/beam-ux`, so the editor mounts in an Inertia page and in the SPA alike.
A host conforms by mounting the kit, not by copying it. Decided in editor-parity ticket 10
(splicewire-ecosystem `.scratch/splicewire/splicewire-ecosystem/editor-parity/`), which also holds each host's verdict
and the adoption order.

## Context

Editor-parity ticket 02 found that only the five starters run the shared editor. They get it through
`@splicewire/beam-inertia`'s `src/editor` wrapper. The beam site (`splicewire/splicewire`) and `rushing/audiostud`
run copies of an earlier wrapper, which have diverged from it and from each other. The flagship has no canvas at all.

The wrapper was in the wrong package for what comes next. `beam-inertia` also carries authentication pages, realms
and the operator desk, so a host can't take the editor without them. And the editor now has to mount outside Inertia:
Tower's app realm is the flagship's SPA (tower-is-splicewire D1′), and a tenant edits its Hosted site in the workspace
(`splicewire/tower docs/adr/0008-a-tenants-site-is-a-hosted-site-served-from-its-own-schema-on-its-own-origin.md`).

The move is small. Measured 2026-10-14 at `4342bd9`, the wrapper's only Inertia ties are two `usePage` reads, the
canvas theme and whether the viewer may author (`beam-inertia/src/editor/page-editor.tsx:68`, `mount.tsx:58`), and
one config read for an injected transport (`transport.ts:130`).

## Decision

1. **The editor kit lives in `@splicewire/beam-ux`**, on a subpath of its own. It takes three inputs: the canvas
   theme, whether the viewer may author, and the entry transport (`UxBuilderClient`). It holds the in-place page
   editor and the window-mode mount, Edit mode for a rendered entry, the format gate in front of the canvas, and the
   default islands and canvas configuration.
   *Amended by ADR-0006 decisions 1 and 5 (2026-10-16): the gate checks the Body Kind, not the format, and the `Mdx`
   island leaves the default islands.*
2. **`beam-inertia` keeps a thin adapter** that reads those inputs from Inertia page props. The SPA passes a token
   transport over the API mount. A host can take the editor without taking `beam-inertia`'s authentication, realms or
   desk.
3. **The shell is the one splicewire/splicewire-app ADR-0072 already chose**: `@schemastud/frame`'s
   `FiveRegionEditShell` over a `@schemastud/seam` widget registry. The canvas is one body surface in it, registered
   as `beam-ux-canvas`. The entry's format chooses the surface. The canvas opens `tsx` entries, and the surface for an
   MDX entry is editor-parity ticket 15's decision. The kit adds no heavy editor dependency to `beam-ux`: a heavy
   surface loads lazily or is supplied by the host.
   *Amended by ADR-0006 decisions 1 and 3 (2026-10-16): the Body Kind chooses the surface, so the canvas opens MDX pages,
   which hold blocks. Text is edited through `@schemastud/blockdoc`, which `beam-ux` loads lazily.*
4. **A host conforms** when every editing surface it shows is packaged or extended at a declared seam (the transport,
   the theme, the component registry, chrome, a workflow binding) and none is a host copy. Its write path is the
   packaged entry operations over the publication pins
   (`splicewire/laravel-beam-ux docs/adr/0225-an-entry-has-one-history-a-save-is-a-draft-and-publish-moves-the-pin.md`),
   and its renderer is `Route::beamUxSite`. An author reaches the editor two ways: Edit mode on the live page, and
   Entries in the Site section.
5. **What every host copies identically is packaged.** The five starters carry byte-identical copies of the server
   half: the page-to-entry binding (`PageEntryRef`, `EntryPageData`), `EntryBody`, the theme seeder, the entry
   operation mounts and the theme and author props. Those move into `splicewire/laravel-beam-ux`, and the account
   theme page into `beam-inertia`'s page map.

A host that edits no site content in the app is **exempt**, and its verdict says why. A host that will adopt once
something else lands is **waiting**, and its verdict names what.

## Considered options

- **A second entry point in `beam-inertia`.** The SPA would depend on an Inertia package and its peer set to mount an
  editor that doesn't use Inertia.
- **A new package.** It would split the editor between `beam-ux`, where the canvas and the dock already are, and a
  package that exists only to hold the glue between them and a host.
- **Leaving the copies and checking them.** The copies already disagree. Editor-parity ticket 02 measured the account
  theme page as byte-identical in the five starters on 2026-10-12. On 2026-10-14 it had three versions. A check finds a fork after it happens. Packaging
  means there is nothing to fork.

## Consequences

- The starters don't change behaviour. `beam-inertia` re-exports the kit through its adapter.
- The beam site and audiostud delete their wrapper copies. The beam site's host undo goes with its versioning triplet,
  and docs/adr/0004's Local Session replaces it.
- The flagship mounts the kit twice: in the SPA's operator Site section, and as Edit mode on its central Inertia pages.
  A tenant's Hosted site reuses the SPA mount.
- The format gate is part of the kit. A host that mounts the canvas through its own copy can open it on an entry whose
  every save the server refuses. The beam site's copy does that today.
