# Message ratchet baseline notes

## @splicewire/beam-accounts — localization 29

Part A1 (the seam, and tokens-roster.tsx) moves all 68 of tokens-roster's pinned nodes (114 under frame-foundation 65's widened scanner) onto beam-accounts' catalog, so its --write lowers 296 to 228. No raw node remains in tokens-roster.

Part A2 (tokens-page.tsx, team-page.tsx, and utils.ts' type/expiry maps) moves all 131 of their pinned nodes (134 widened) onto the catalog, so its --write lowers 228 to 97. None remains in those files.

Part A3 (the auth forms, accept-invitation, passkeys, account shell/nav, token-fragment, auth-fields, passkey-button, demo-login; plus the text scan's auth-hooks/webauthn errors) moves the remaining 97 pinned nodes (98 widened) onto the catalog, so its --write lowers 97 to 0. beam-accounts reads zero under both scanners. Raw by classification and uncounted: the three provider-misuse developer errors (auth-provider, provider, team-provider).

## @splicewire/beam-ux — localization 31 (start 861)

Coord-lead@calcucrypt ruling 2026-11-17 03:15Z: the true start is 861. config-sections 10a (2b1b5d90..2d8562a2) added beam-ux/src/config/ copy (61 findings) without a baseline update; ratchet red on main since; CAUSE-800-861.md 62d3556c. The pinned scanner (@schemastud/messages 47810c9e, TypeScript 5.9.3) reads 800 on the 413b67b3 tree that wrote 800 and 861 on ec532e21, so the delta is that copy, not the scanner. This entry raises the stored count to the measured one so the ratchet is green before the sweep lowers it; localization 31 part F owns the 61 and must show them gone.

Part A (the seam plus site/, entries/, shell/, collections/, desk/, state/, admin/, nav/, appshell/, author/) moves 106 of its 109 nodes onto beam-ux's catalog, so its --write lowers 861 to 755. Its three remaining nodes are not translatable copy and stay raw:

- (catalogued by 31 part A follow-up 2, ruling 11-17 04:30Z: a shared development build is read by people who are not its authors) beam-ux/src/author/AuthorNote.tsx — the author-note title.
- beam-ux/src/shell/default-desktop.tsx:37 — `surfaceMap` (JsxText): a prop name, passed into the translated sentence as a code parameter.
- beam-ux/src/site/EntryBody.tsx:230 — `php artisan splicewire:beam:ux:compile` (StringLiteral): a command, passed into the translated sentence as a code parameter.

Part D (the root files: releases, FilesComparisonPanel, use-region-publication, RegionEditorBody, ThemeEditor, RegionCanvas, recording, RegionInspector, StructurePanel, hooks, RegionOverlay, UxBuilder) moves 200 of its 204 nodes onto the catalog, so its --write lowers 755 to 555. Its four remaining nodes are code tokens shown in monospace in the frame and list editor previews, kept raw:

- beam-ux/src/RegionEditorBody.tsx — `frame:enrollment` (a frame key, passed into the translated sentence as a code parameter), `route` (a manifest field name), `/programs/` (a route prefix) and `{slug}` (a route parameter, passed into the translated sentence as a code parameter).

Part B (canvas/ BlockInspector, PageEditor, BindingInspector, templates, block-style, attrsSchema) moves all 167 of its nodes onto the catalog, so its --write lowers 555 to 388. No raw node remains in its files.

Part F (editor/ and config/) moves 145 of its 147 nodes onto the catalog, so its --write lowers 388 to 243. config/ reads zero: config-sections 10a's 61 are erased (60 moved; the generated server-manifest dump became ConfigArea.manifest.fixtures.ts, a test fixture by name, as 28a did for resource-filters.fixtures.ts). Its two remaining nodes are machine text, kept raw:

- beam-ux/src/editor/ComponentSessionHost.tsx — the scoped `.component-session{…}` CSS (FirstTemplateToken).
- beam-ux/src/editor/PageSettings.tsx — `string`, the JSON Schema type a field defaults to (StringLiteral).

Part C (the rest of canvas/) moves 113 of its 114 nodes onto the catalog, so its --write lowers 243 to 130. Its one remaining node is machine text, kept raw:

- beam-ux/src/canvas/Breadcrumb.tsx — `fragment`, the JSON node kind a breadcrumb names beside raw tag names such as `div` (StringLiteral).

Part E (sitemap/) moves all 114 of its counted nodes onto the catalog, and ruling (c) renames the test/story fixture sitemap/fixture.ts to sitemap/fixtures.ts (its 6 nodes leave by the scanner's fixture convention, as 28a did), so its --write lowers 130 to 10. sitemap/ reads zero.

Part A follow-up 2 catalogues the AuthorNote title (10 -> 9). The 9 nodes left in @splicewire/beam-ux are the raw nodes recorded above (A 2, D 4, F 2, C 1). Each is machine text: code tokens, CSS, a shell command, a JSON type, or dev-only chrome. Taking the count to zero needs a ruling that accepts them, as root did for beam-inertia's 13 in 28a.

## @splicewire/beam-inertia — localization 28a

Root qitem-20261114193919-4a20610b (2026-11-14 19:39Z) accepts exactly these 13 non-copy brand/machine AST nodes. This supersedes the count-12 ruling 73e93872. The complete styled wordmark is one raw rich :brand parameter, preserving raw beam· followed by bold raw os. Every listed literal stays raw; no technical catalog line or reshaping hides it.

- beam-inertia/src/frame/router.tsx:111 — `mounts:` (JsxText).
- beam-inertia/src/os/default-desktop.tsx:30 — `beam` (JsxText).
- beam-inertia/src/os/operator-desk.tsx:119 — `beam` (StringLiteral).
- beam-inertia/src/os/shell-config.tsx:355 — `SURFACE_MAP[&apos;` (JsxText).
- beam-inertia/src/os/shell-config.tsx:355 — `&apos;]` (JsxText).
- beam-inertia/src/os/shell-config.tsx:406 — `beam` (JsxText).
- beam-inertia/src/os/shell-config.tsx:406 — `·os` (JsxText).
- beam-inertia/src/os/shell-config.tsx:437 — `beam` (JsxText).
- beam-inertia/src/os/shell-config.tsx:439 — `os` (JsxText).
- beam-inertia/src/os/shell-config.tsx:442 — `beam·` (JsxText).
- beam-inertia/src/os/shell-config.tsx:442 — `os` (JsxText).
- beam-inertia/src/pages/operator/dashboard.tsx:78 — `@splicewire/beam-mainframe` (JsxText).
- beam-inertia/src/pages/os.tsx:12 — `beam·os` (StringLiteral).

Nine brand-wordmark nodes, one package name, one raw manifest field mounts:, and the two SURFACE_MAP entity-source nodes are not translatable copy. The real public runRatchet --write lowered the committed baseline from 315 to 13; every other Beam package count is unchanged. Any additional finding needs a new ruling.

resource-filters.fixture.ts became resource-filters.fixtures.ts with 100% similarity under coord18:21: only a test/story fixture and its two imports, matching the scanner convention. Its 11 hits leave by classification, not content rewriting.

## @splicewire/beam-calendar — localization 30

Part C (the seam, CalendarCellForm.tsx and chrome.tsx) moves 45 of its 46 pinned nodes onto beam-calendar's catalog, so its --write lowers 46 to 1. The census sized it at 39 (2026-11-12); re-taken at 46 on beam main bcd7c872. The text scan added what the ratchet cannot see: the form's four validation errors and its save-failure fallback (now stored as keys and translated where they render), the frequency units, and the status labels a helper returned. The one node left:

- beam-calendar/src/CalendarCellForm.tsx — `renderContentPicker` (StringLiteral): a prop name, passed into the translated sentence as a code parameter.

Not catalogued, by rule: the developer guards `CompositionCalendar single mount requires…`, `CalendarCellForm must be rendered inside…` and the client's `Aggregate create must target a calendar…` (thrown errors; a client failure renders as it arrived), and a status the server projects that the package does not declare (humanized, rendered as given).

## @splicewire/beam-docs — localization 30

Part D1 (the seam, the publishing panel and page, publications.ts' request failures, and the docs chrome: DocsHeader, DocsBreadcrumb, DocsLayout, AppearanceToggle, ProductSwitcher, DocsSearch, HeadingAnchors, ApiReference's registry link) moves 46 of its 48 nodes onto beam-docs' catalog, so its --write lowers 114 to 68. The census sized beam-docs at 56 (2026-11-12); re-taken at 114 on beam main d20e3def. The text scan added what the ratchet cannot see: the publishing panel's stored errors and live announcement, and publications.ts' fixed request failures (now a DocsRequestError carrying a catalog key; its message stays English), the HeadingAnchors copy status kept in state and its visible data-copy-label, the version placeholder, and the version field's label (the generated schema's title, now read through ui:title). The attempt time keeps toLocaleString() (the runtime's locale), as beam-ux, beam-inertia and beam-accounts do: catalog-locale dates are localization 29's nomination (c). The two D1 nodes left are CSS:

- beam-docs/src/HeadingAnchors.tsx — the scoped `.beam-docs-main [data-beam-heading-controls]{…}` CSS (FirstTemplateToken).
- beam-docs/src/ThemeDocsStyle.tsx — the `.beam-docs{…}` custom-property declarations (TemplateExpression).

Not catalogued, by rule: the server's values (a publication's status, version, namespace, slug and failure text; a product's name and tagline; a search hit's title, trail and excerpt; the fallback link's label) render as given, as does a validator's own message other than the version pattern's. Part D2 takes PhpApiReference, PhpApiProse, RegistryRegistrants, RegistryIndexNav and DataExample.

Part D2 (PhpApiReference, RegistryRegistrants, RegistryIndexNav, DataExample; PhpApiProse had none) moves 58 of their 66 nodes onto the catalog, so its --write lowers 68 to 10. The hand-rolled plurals (the overview's ":count symbol(s)" and the registrants' unattributed count) read m.choice, byte-identical in English; the filter's "Filter :count symbols" was never singular, so both of its plural forms keep "symbols" in English, and a translator gets both slots. Sentences that carry code (No published symbol is named <code>, Loading <code>…, <code> could not be read., alias of <code>, from <link>) go through richMessage. RegistryIndexNav's tree carries our "Overview" title, so it is rebuilt when the reader's messages change (m in the memo's deps); its "Other registries" track label was beyond the ratchet. The ten nodes left in beam-docs are not copy:

- CSS: DataExample, HeadingAnchors, PhpApiReference, RegistryRegistrants (FirstTemplateToken) and ThemeDocsStyle (TemplateExpression).
- CSS class names the scanner reads under a classes object's header/children keys: PhpApiReference `beam-php-api-header`, RegistryIndexNav `beam-registry-index-header` and `beam-registry-index-children` (StringLiteral).
- DataExample `JSON` (JsxText): a format name, shown as code.
- PhpApiReference `of …` (TemplateExpression): PHPDoc template syntax (`@template T of Bound`).

One deliberate exception, beyond the ratchet (REVIEW-30D2): PhpApiReference's `(global)`, the rail heading for symbols in PHP's global namespace, stays English. ExpandableNav (@schemastud/nav) draws a group's KEY as its heading and derives the group's ids and persisted collapse-state keys from it, with no separate group label, so translating it would re-key a reader's saved rail state per locale. A `groupLabel` on ExpandableNav would lift it.

## @splicewire/beam-workflows — localization 30

Part W1 (the seam, WorkflowEditor, WorkflowGraph, WorkflowStepper, WorkflowDiff, WorkflowMigrate, and migratePlan's blockedHeadline) moves 71 of its 72 nodes onto beam-workflows' catalog, so its --write lowers 186 to 115. The census sized beam-workflows at 120 (2026-11-12); re-taken at 186 on 3fb6c655. Beyond the ratchet: blockedHeadline's hand-rolled plural (a public export; it now takes the reader's messages, English by default) and the migration toasts' and summaries' "record(s)" lines, which were never pluralised, so both of their plural forms keep "record(s)" in English (likewise the graph's "Scroll sideways to see all :count places →"). The migrate explainer is one sentence around three nodes (bold "from" and "to", which are copy, and `$ref`, which is code), so it goes through richMessage. The one W1 node left:

- beam-workflows/src/WorkflowMigrate.tsx — `$ref` (JsxText): a JSON Schema keyword, shown as code inside the translated explainer.

Parts W2 (action/reaction forms, action detail, reaction history, recipient picker) and W3 (WorkflowsAdminPage) take the rest.

Part W2 (WorkflowActionForm, WorkflowActionDetail, WorkflowReactionForm, WorkflowReactionHistory, RecipientPicker) moves 77 of its 78 nodes onto the catalog, so its --write lowers 115 to 38. Beyond the ratchet: the forms' and detail's stored error text (now Notices: our fallback line, or the error's own message as it arrived), the action form's timing memo (it now keeps a catalog KEY, so it needs no m in its deps) and its string default `submitLabel = 'Schedule transition'` (now `submitLabel ?? m.t(...)`: the prop stays optional, so ./action-form's API and beam-ux's import are unchanged). "N calendar days later" was never singular: both plural forms keep the English. The node left:

- beam-workflows/src/WorkflowActionForm.tsx — `America/New_York` (StringLiteral): an IANA zone id, the timezone input's example value.

The zone/date formatters (Intl.DateTimeFormat(undefined, …)) keep the runtime's locale, as D1 ruled for toLocaleString. Part W3 (WorkflowsAdminPage) takes the remaining 37.

Part W3 (WorkflowsAdminPage and its BindingPanel) moves all 36 of its nodes onto the catalog, so its --write lowers 38 to 2. Beyond the ratchet: the lineage filter's scope buttons rendered their keys (`all`/`system`/`custom`) as labels, now catalog lines; the coverage line's hand-rolled plural reads m.choice ("Governing :count record|…records (pinned on first transition)."); " · :count rec" was never pluralised (both forms keep it), and the " · " separators render outside the lines. W3 also carries REVIEW-30W1's two LOWs: WorkflowMigrate's "…and :count more" on m.choice (two identical English forms) and workflows.locale.test rendering WorkflowEditor, WorkflowStepperTrack and WorkflowMigrate under es. beam-workflows' two remaining nodes are not copy: the `America/New_York` placeholder (W2) and the `$ref` code token (W1).

Also in W3 (REVIEW-30W2, root's condition, REVIEW-30W3): src/messages.ts imports the catalog through the package's own exported `@splicewire/beam-workflows/messages.js` subpath, a generated ES module of the catalog (`messages.default.js` + `.d.ts`, written and checked against the JSON by the catalog script), kept external in both tsup configs (with `@schemastud/messages` and `/react`), so no entry inlines it and Node/SSR loads it without an import attribute (a bare JSON import failed with ERR_IMPORT_ATTRIBUTE_MISSING); vitest aliases the subpath to the local file. Measured: the standalone ./action-form build 23,680 -> 9,981 bytes, no English catalog value in it. `build` runs scripts/node-smoke.mjs (Node import of ./action-form + a renderToString of the form). beam-ux builds against it, its releases.test (default "Schedule transition") passes, and its built chunk that imports ./action-form loads in plain Node.
