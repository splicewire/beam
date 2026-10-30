# @splicewire/beam-ux

## 0.8.0

### Minor Changes

- 15c58c3: Add `SectionTabs` to `@splicewire/beam-ux/nav` — the second consumer of a realm's projected `nav`, beside `RealmNav` (app-walkthrough APP-17, M7′). It draws the active section's projected `children` as the top-bar primary strip, and a child group's own `children` (e.g. Knowledge → Graph) as a divider-separated second strip, from the SAME server-projected, entitlement-filtered tree the rail reads. Pathname-driven (the manifest is fetched per realm), framework-neutral (injected tab link) and theme-neutral (packaged strip classes, overridable). Hosts stop keeping a client `SECTION_META` roster for tabs.
- 4c12998: The editor canvas previews Block Styles at the selected breakpoint and state. Breakpoint layers answer to the canvas's own `beam-canvas` container instead of the author's viewport, and the inspector's selected state (for example hover) applies as if active. `compileBlockStyle` and `compileEntryStyles` take an optional `preview` (`{ container, state }`); without it their output is unchanged, so published pages keep `@media` and real states with the same class names.
- ad864c9: The Body Kind chooses the editor surface (beam JS ADR-0006 d1, editor-parity EP-26 D).

  - The canvas opens every entry the server declares `blocks`, MDX pages included on a host that holds MDX as blocks (ux-0233 d1). An entry that holds source (a host's unconverted MDX page, a Component entry) gets the stated refusal.
  - `canvasAccepts(entry)` replaces the format-only check. An entry without a `bodyKind` falls back to the format gate, so an older server is unchanged.
  - beam-mainframe's `EntryRef` and page context carry an optional `bodyKind`, also broadcast on `beam-ux:mode`. beam-inertia reads it from `props.entry.bodyKind`.
  - Source Mode labels its text with the entry's File Language: `MDX source` for an MDX page.

- 3cd0a8c: Add declared component slots and prop references to the TSX Lens and canvas. Export `LensContext` and accept an optional context parameter in `fromJson`; existing calls remain compatible.
- 3f000f0: Existing entries with no history can open the editor without a read-side write. The first Save draft or Publish sends a null base; the server initializes the trusted baseline atomically before recording the draft. Existing histories still require a publication pin. Save-draft transport implementations now accept a nullable base version.
- 5f6b1de: Add the lightweight `@splicewire/beam-ux/edit-mode` entry for reading the current authoring mode without importing the canvas editor entry.
- ecb80f0: Page settings choose the page's File Language (ux-0233 d5, editor-parity EP-26 F). The choice appears only where the host writes more than one (`fileLanguages` in the body envelope), and Publish moves the page's mirror file. `EntryPageSettings` gains `fileLanguage`.
- e024aa9: Page settings show the frontmatter keys nothing declares (ux-0233 d3, editor-parity EP-26 E2a). The page keeps them as written. Each is listed with a Remove control that drops it from the draft. `EntryPageSettings` gains `unclaimed: Record<string, string>`.
- 22a1dbd: Page settings edit Page Fields (ux-0233 d4, editor-parity EP-26 E2b). A page picks which of the host's registered Page Fields its child pages carry (`childFields`). A child page edits the fields its parent declares, with inputs typed by the schema the server sends in the body envelope (`pageFields`). The server checks them on save. `EntryPageSettings` gains `childFields` and `fields`.
- 144ad9a: Page settings list the Redirects that lead to the page (ux-0236 d14): each one's old path ("and below" for a
  path-and-below one), "temporary" for a 302, and who made it. Both editors read them from the page's body envelope
  (`redirects`); a server that sends none shows no list. They are managed in the site's Redirects, not here.
- 8e03ab7: A Release's Redirects (ux-0236 d2, d12). The Preview bar lists "Redirects this Release leaves": each URL the Release
  moves or takes down and where it goes once it publishes, or "not found" for a Take-down that names no page. The
  Release panel lists them too: the ones it would leave while open, and the ones it left once published, each with
  Remove. The editor transport gains `removeRedirect(id)`, which beam-inertia sends as `DELETE /beam-ux-redirects/{id}`.
- 12fb9ac: Remove the deprecated `onEditText` prop from `CanvasNode` and `CanvasSiblings` (`@splicewire/beam-ux/canvas`). Text leaves are edited through the prose seam (`onEditProse`), and the callback was no longer called; a caller still passing it now gets a type error instead of a silently ignored prop.
- f312863: Breaking: remove the `@splicewire/beam-ux/leaf` export and its unused inline-leaf adapter. Prose Runs now use the package-owned canvas integration with Blockdoc. This export retirement requires the next 0.x minor release, 0.8.0, rather than a patch. It does not remove MdxDocumentEditor or change beam-mdx; those remain EP-26 work.
- 1e54793: The first, non-breaking step of retiring the MDX island and editor (ux-0233, editor-parity EP-26 G1). The rest goes as each host converts (EP-42).

  - `CanvasConfig.MdxView` / `MdxEdit` are optional and `@deprecated`. Without them, an `Mdx` node shows its MDX text read-only on the page and in the canvas, and the insert palette offers no new `Mdx` node.
  - The packaged canvas config no longer passes the starter stubs, and the stub `MdxView`/`MdxEdit` exports are removed from `@splicewire/beam-ux/editor` and beam-inertia. No consumer in the estate imports them; audiostud ships its own island.
  - `MdxDocumentEditor` and `KIT_MANIFEST` are `@deprecated`. The kit is declared on the server (`MdxKitNodeSource`), and MDX pages are edited as blocks.

### Patch Changes

- 9af7d51: Preserve the server's typed page settings when loading the site editor, so authors can edit and save settings through the versioned Page settings control.
- 08f69bb: Add `@splicewire/beam-mdx/lens`, the MDX Lens (ux-0233 d2, editor-parity EP-25).

  - `readMdx` reads an MDX page body into the same JsonDoc the TSX Lens produces. Markdown reads as the HTML profile's nodes, and JSX as components whose attributes go through the TSX Lens. Comments, other expressions and spread tags become Opaque Islands.
  - `printMdx` prints canonical MDX, one line per paragraph, and reaches a fixed point.
  - `@splicewire/beam-ux/jsondoc` exports `jsxAttributes`, so both printers write a tag's attributes and lens-owned fields identically.

- cbc1dd7: `jsonToTsx` keeps a space a reader sees between a text run and an inline element. A mixed block prints each child on
  its own line, and JSX drops whitespace that touches a line break, so "Read this <em>first</em>" printed as "Read
  thisfirst". A visible leading or trailing space now prints as `{" "}`, which the lens reads back as a text node " ";
  whitespace that touches a line break stays layout. Mirrors laravel-beam-ux's `JsonDocPrinter`.
- 0a3c23b: Focus a prose editor when its deferred Tiptap instance becomes ready, so an author's activation gesture is followed by typing without another click. Subsequent value updates do not steal focus.
- aff425e: Preserve the live prose document when its own change returns through the controlled JsonDoc value. This prevents character loss and caret resets during typing while still applying genuine external edits.
- a8a03a0: Supply compileEntryStyles to the published artifact runtime so generation-3 styled pages render.
- 7d1826a: Reserve floating-panel space only where it overlaps the page editor's content box, and stack the block outline in narrow canvases so prose editing remains visible.
  Double-click activation follows the first-click node when selection reflows the canvas.
- aef0699: Let theme authors publish a saved theme through the existing Release workflow, including review when required and server authority checks.

## 0.7.0

### Minor Changes

- Package the transport-independent editor kit and one-history editor. Replace the `blockdoc` and `blockdoc/json` export paths with `tsx-lens` and `jsondoc`; consumers must update imports.

## 0.6.0

### Minor Changes

- 7a93ed7: Move AccountShell and its account data/nav exports from beam-ux/account to
  beam-accounts/account. The old beam-ux/account entry is removed without an alias.
  Update the Inertia adapter and story together; consumers must upgrade this release
  set together. AppRail retains its default renderer and exposes router-neutral row
  and group rendering seams for sidebar primitives. Account collapse, tooltips,
  mobile disclosure, slots, prefetch and sidebar state remain host-controlled.

  Versioning policy: remain on 0.x; a minor may remove a breaking entry. Land after
  the train-3 beam-ux 0.5.0 bump, then release this move as beam-ux 0.6.0 with
  coordinated Accounts/Inertia minors and matching peer ranges.

- ff7e5e7: Fix the dashboard sidebar user chip (G1-BEAM-FRESH-INSTALL): on a fresh install the chip rendered
  unstyled — avatar and name stacked, no menu control — because the IA-3 consolidation moved the user
  menu onto `RealmSwitcher`, whose trigger is a bare `<button>` with no layout, dropping the old
  `SidebarMenuButton` + `ChevronsUpDown` chrome.

  `@splicewire/beam-ux` `RealmSwitcher` gains a `triggerClassName` prop applied to the trigger button,
  so each shell styles the trigger for its slot. The trigger is otherwise unchanged — a consumer that
  passes no `triggerClassName` (e.g. a plain-text header trigger) renders byte-identically to before.

  `@splicewire/beam-inertia` `NavUser` passes the sidebar menu-button chrome (full-width flex row, so
  the avatar and name sit side-by-side rather than stacking, plus hover/open state) and restores the
  `ChevronsUpDown` menu-control affordance to the label.

- 233587c: Add a router-neutral app shell, injected navigation rail and typed runtime factory to the appshell entry. Hosts retain route creation, outlet rendering, authorization, feature rosters and mounting.
- 7d10b69: `StateBoundary` refusals are no longer dead ends. An optional `wayBack` (`{ label, target }`) renders a way back on every refusal/failure state — forbidden, not-found, and the error fallback beside "Try again" — and on the default upsell copy. It defaults to a plain `<a href={target}>`; pass an optional `render({ target, className, children })` to route it through the host's own router (e.g. react-router's `<Link>`) instead of a full page reload. Also exports `ForbiddenState`, the forbidden page-state node (it owns `data-page-state="forbidden"`), so a known refusal with no query behind it renders the shared refusal directly instead of faking a 403 query. Existing states and the retry policy are unchanged.

### Patch Changes

- 3d22d60: Dismiss an open realm switcher with Escape and return focus to its trigger.
- Updated dependencies [201a73e]
  - @splicewire/beam-resources@0.1.3

## 0.5.0

### Minor Changes

- 8ccb81f: Expose the app runtime Provider for transport adapters, support an explicitly unframed outlet, and export the shared mode placements so existing shell APIs can delegate without duplicating chrome.

## 0.4.0

### Minor Changes

- Release the realm navigation, appearance and docs-chrome work accumulated since 0.3.0: `RealmSwitcher`,
  `RealmHeader` and `useCurrentRealm` with zone-aware `RealmNav`; one appearance contract at
  `@splicewire/beam-ux/appearance` (light, dark or system); the page-state module at `@splicewire/beam-ux/state`;
  `<AuthorNote>` for dev-only author chrome; the opt-in token layer with `tokens-docs.css` scoped to `.beam-docs`;
  and `./theme.css` shipped in `dist`.

### Patch Changes

- 54f3933: Raise the docs accent contrast so prose links and linked inline code meet WCAG AA in light and dark themes.
- b998399: Keep the RealmSwitcher sign-out door as a full-page navigation when hosts inject a client-side router link.
