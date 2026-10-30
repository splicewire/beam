# @splicewire/beam-inertia

## 1.0.0

### Minor Changes

- 3f000f0: Existing entries with no history can open the editor without a read-side write. The first Save draft or Publish sends a null base; the server initializes the trusted baseline atomically before recording the draft. Existing histories still require a publication pin. Save-draft transport implementations now accept a nullable base version.
- c339a17: The canvas registry draws what an MDX page holding blocks places, and the auth islands fail closed off their own route (EP-42).
  - A host whose MDX pages hold blocks (`beam.ux.mdx.holds_blocks`) also sets `configureBeamInertia({ mdxHoldsBlocks: true })`. beam-inertia then registers `SiteNav`, bound to the page's `nav` prop, and `ManifestTable`. laravel-beam-ux adds both to an MDX page's profile, because the packages' shipped docs pages place them. They join only there, so the doctor's registry audit still agrees with the switch off.
  - Each packaged auth island renders its page only on the route that serves it (Fortify's default paths), and hands the page that route's Inertia props. Anywhere else it renders a stated refusal (`data-auth-island-refused`), never a form that cannot work, such as a reset form with no token.
- d185fd4: The packaged `IntakeForm` reaches rendered pages (EP-07d).
  - **beam-inertia:** a host that turns on laravel-beam's public intake door also sets `configureBeamInertia({ intakeForms: true })`. beam-inertia then registers `IntakeForm` in the canvas registry, as a non-submitting preview while an author edits. The packaged entry page provides each form's server-resolved schema (`props.intakeForms`) and the door's honeypot field (`props.intakeHoneypotField`).
  - **beam-intake:** `IntakeForm` draws its fields through the host's `renderForm`, the same seam as `IntakeSectionForm`, falling back to `SchemaForm`, which shows the door's 422 errors on their fields. It sends the CSRF header beam's other transports send. `IntakeFormRenderProps` gains optional `errors` and `submitLabel`.
- 1aef900: `registrySnapshot(registry?)` returns the sorted names of the components the canvas registers (EP-07, ux-0228 d6). By default that is beam-inertia's registry, gated by the configured auth features. A host writes the list to the path in `beam.ux.manifest.js_registry`, and `beam:doctor` compares it, both ways, with each realm's Manifest Profile. Without that file the doctor reports the check as inconclusive, never as a pass.
- 8e03ab7: A Release's Redirects (ux-0236 d2, d12). The Preview bar lists "Redirects this Release leaves": each URL the Release
  moves or takes down and where it goes once it publishes, or "not found" for a Take-down that names no page. The
  Release panel lists them too: the ones it would leave while open, and the ones it left once published, each with
  Remove. The editor transport gains `removeRedirect(id)`, which beam-inertia sends as `DELETE /beam-ux-redirects/{id}`.
- 039f20b: Report successful sign-up and first-factor login events from the packaged auth surfaces.

### Patch Changes

- ad864c9: The Body Kind chooses the editor surface (beam JS ADR-0006 d1, editor-parity EP-26 D).

  - The canvas opens every entry the server declares `blocks`, MDX pages included on a host that holds MDX as blocks (ux-0233 d1). An entry that holds source (a host's unconverted MDX page, a Component entry) gets the stated refusal.
  - `canvasAccepts(entry)` replaces the format-only check. An entry without a `bodyKind` falls back to the format gate, so an older server is unchanged.
  - beam-mainframe's `EntryRef` and page context carry an optional `bodyKind`, also broadcast on `beam-ux:mode`. beam-inertia reads it from `props.entry.bodyKind`.
  - Source Mode labels its text with the entry's File Language: `MDX source` for an MDX page.

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
  - @splicewire/beam-mainframe@0.2.0
  - @splicewire/beam-accounts@1.0.0

## 0.5.0

### Minor Changes

- Delegate editor surfaces to the packaged UX editor kit and require beam-ux 0.7.0 or later in the 0.7 line.

## 0.4.0

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

- 201a73e: Make the login "Sign up" affordance follow the server registration policy. The packaged login page
  now gates the `/register` link on the `canRegister` page prop — sourced from
  `Features::enabled(Features::registration())`, the same Fortify feature registry the `/register`
  route reads — instead of the build-time client `featureEnabled('registration')` flag. On a
  closed-door host (`ACCOUNT_REGISTRATION=closed`, where `/register` 404s) the link no longer renders
  as a dead affordance; it mirrors the existing `canResetPassword` prop convention.

  `@splicewire/beam-resources` gains the `canRegister: undefined | boolean` field on `AuthEntryPageData`
  (the projection of the beam-accounts DTO field).

  Host contract: the Fortify auth-view closures must now share `canRegister` on the auth-entry props
  for the link to render on an open-registration host (the beam starters' `loginView` follow in the
  same lineage once this is released). A host that does not share it simply shows no Sign up link.

### Patch Changes

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

- Updated dependencies [201a73e]
  - @splicewire/beam-resources@0.1.3

## 0.3.0

### Minor Changes

- Accept @splicewire/beam-ux 0.5 while preserving compatibility with 0.4 consumers.

## 0.2.0

### Minor Changes

- 15b8a4f: Require `@splicewire/beam-ux` 0.4.0: the peer moves from `^0.2.1 || ^0.3.0` to `^0.4.0`, because `use-appearance`
  re-exports the appearance contract from `@splicewire/beam-ux/appearance`, which beam-ux first ships in 0.4.0.
  Hosts on beam-ux 0.3 stay on beam-inertia 0.1.x. Release this only after `@schemastud/frame` (with
  `FrameActionError`, `parseResourcePage`, `useBrowserUrlState`) and `@splicewire/beam-accounts` (with
  `CreateTeamForm`, `AcceptInvitationPanel`) are published, and raise beam-inertia's peer ranges on them to those
  versions in the same release.

### Patch Changes

- 805b60e: Frame icon map: key every icon name a family resource declares in kebab case (`receipt`,
  `shield-check`, `mic`, …) so rail rows and cards draw their declared lucide glyph instead of the
  fallback (`507f87c`, `203393a`). The published `0.1.3` dist has no icon map (`receipt` absent);
  `renderLink` and `manifestLookup` were already in `0.1.3` (`d86e0cb` precedes the `dc5833d` bump).

## 0.1.3

Require Frame 0.2 and UI 0.1.1 so the packaged resource transport, manifest lookup and card widgets resolve against compatible published dependencies.
