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
