/**
 * `@splicewire/beam-ux/docs` — the out-of-the-box docs chrome, and the registry an entry's
 * `layout`/`template` column resolves against (ADR-0213, beam-docs-satellite ticket 26).
 *
 * Kept OUT of `/site`, whose stated contract is no router and no state: this entry point is where the
 * arrangement lives, and it composes `@schemastud/nav` for the on-this-page column. `/site` keeps the
 * theme-neutral atoms (`Prose`, `SiteLayout`, `SiteNav`, `EntryBody`, and the two contributed
 * reference surfaces) and neither entry point ships a palette, fonts, a wordmark, or a router import
 * — the two invariants that replaced ADR-0209 §6's page prohibition (§2).
 *
 * ## What is here
 *
 * - {@link DocsLayout} — header · breadcrumb · rail · main · on-this-page, every part a slot or a class.
 * - {@link ProseTemplate} / {@link SpreadTemplate} — the reading measure and the full-bleed surface;
 *   ADR-0213 §1's CSS hack promoted to data.
 * - The chrome **registry** ({@link registerChrome}) — a name resolves to a HOST registration first,
 *   then to the packaged map in `builtins.ts`, and only then to another entry's slug (§7). The
 *   packaged map is read by the resolver rather than registered at import, because `sideEffects:
 *   false` entitles a bundler to drop an import-time registration — and it did.
 * - {@link configureEntryPage} — how a host hands the packaged Inertia page the things only a host has.
 *
 * The page itself lives at `@splicewire/beam-ux/pages`, deliberately: that is the one module in this
 * package that imports `@inertiajs/react`, and keeping it separate is what lets everything here stay
 * usable by a host that renders entries some other way.
 *
 * ## What is NOT here, and why — settled, not deferred (ticket 39)
 *
 * `DocsHost` — the read⇄window authoring host (ADR-0099) — is not in this build and **is not coming**.
 * Not because it is too host-shaped to lift, which is what ticket 26 assumed: because **it has already
 * been lifted, one package down.** `createMainframeHost` in `@splicewire/beam-mainframe` is exactly
 * ADR-0213 §1's host — "providers, capabilities, mode state, the slot registry" above a swappable body
 * — and its own docblock records that `splicewire-app`'s `DocsHost` was one of the two 380-line shapes
 * it was promoted FROM. Five hosts run it today in ~15 lines of config (`rushing/audiostud`,
 * `splicewire/www`, and all three starters). `splicewire-app`'s `DocsHost` is the residue that predates
 * the promotion, not a sixth thing waiting for a home.
 *
 * So the three pieces ticket 39 proposed lifting resolve, and none of them lands here:
 *
 *  - **the content source** (`load`/`save`/`EditSurface`) — already seamed, as
 *    `MainframeHostConfig.renderEditor`. The factory owns the READ leg (`loadEntryBody`) and leaves the
 *    save leg inside the host-local editor, which is where a WYSIWYG's buffer already lives. Adding a
 *    `contentSource` port beside it would ship a second, competing save path into every host that
 *    installs beam-mainframe, with exactly one caller — a write path with no reader, which this map has
 *    paid for three times already (the mdx body codec, the disk mirror's inbound leg, the dead config
 *    keys).
 *  - **the edit buffer** — one host's inversion, bought to feed a side panel that no longer exists (the
 *    editor mounts in `main` now). None of the five factory consumers needed it.
 *  - **`useDocsCan` and route hydration** — already host props. `usePageContext()` returns `canAuthor`;
 *    `hydrateRoutes` is a host module. Nothing to lift.
 *
 * And the lift that *was* proposed would have put **mdxeditor** — a heavy, author-only dependency —
 * inside a package every beam host installs headlessly. That is the same shape as shipping one host's
 * class name in a distributable: the direction (host → package) is legal, the cargo is not.
 *
 * **Mounting an authoring host over the packaged entry page** (what ticket 18 actually needs) is a host
 * act and needs no export from here. {@link configureEntryPage}'s `wrap` runs inside the page, so it
 * cannot give you Inertia PERSISTENCE across navigations — assign the host as the page's persistent
 * layout in the resolver instead:
 *
 * ```ts
 * resolve: async (name) => {
 *     const local = own[`./pages/${name}.tsx`];
 *     if (local) return local();
 *     const mod = await beamUxPages[name]();
 *     if (name === 'site/entry') (mod.default as any).layout = MainframeHost;
 *     return mod;
 * }
 * ```
 */

export { DocsLayout } from './DocsLayout.js';
export { ProseTemplate, SpreadTemplate } from './templates.js';
export {
    registerChrome,
    registerLayout,
    registerTemplate,
    resolveLayout,
    resolveTemplate,
    registeredChromeNames,
    clearChromeRegistry,
} from './registry.js';
export { configureEntryPage, entryPageConfig, resetEntryPageConfig, type EntryPageConfig } from './config.js';
export { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
export { DOCS_LAYOUT_CSS, DOCS_TEMPLATE_CSS } from './css.js';
export type {
    ChromeComponent,
    ChromeProps,
    ChromeSlots,
    EntryPayload,
    EntryArtifactPayload,
} from './types.js';

