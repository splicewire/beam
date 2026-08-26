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
 * - The chrome **registry** ({@link registerChrome}) — a name resolves to a registered component first
 *   and to another entry's slug second (§7). The three above are registered on import.
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

import { DocsLayout } from './DocsLayout.js';
import { registerChrome } from './registry.js';
import { ProseTemplate, SpreadTemplate } from './templates.js';

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
export type {
    ChromeComponent,
    ChromeProps,
    ChromeSlots,
    EntryPayload,
    EntryArtifactPayload,
} from './types.js';

/**
 * The shipped names, registered at import. A host that imports this module for anything at all gets
 * them; a host that registers a layout of its own adds it beside them.
 *
 * These three strings are the same ones `config/beam/ux.php`'s `beam.ux.chrome.registered` is seeded
 * with, and that duplication is deliberate and one-directional: PHP cannot see a TypeScript `Record`,
 * so the doctor check has to be told. `registeredChromeNames()` is what a host echoes back if it ever
 * wants to prove the two lists agree.
 */
registerChrome({
    layouts: { DocsLayout },
    templates: { ProseTemplate, SpreadTemplate },
});
