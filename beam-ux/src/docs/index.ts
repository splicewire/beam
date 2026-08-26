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
 * ## What is NOT here, and why
 *
 * `DocsHost` — the read⇄window authoring host (ADR-0099) — is not in this build. The only live
 * implementation (`splicewire-app`'s, 250 lines) is welded to a content-source abstraction, an mdx
 * editor mount, a window-chrome context and a route-hydration step, none of which is generic yet;
 * lifting it as-is would ship one host's authoring stack to every host, which is the opposite of what
 * ticket 26 is for. It is tracked on the map rather than stubbed here, because a `DocsHost` that is
 * not the one hosts need is worse than no export at all.
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

