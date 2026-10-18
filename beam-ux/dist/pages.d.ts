import * as react from 'react';
import { ComponentType } from 'react';
import { c as EntryPayload, E as EntryArtifactPayload, d as ChromeArtifactsPayload } from './types-CZ-E_FpE.js';
import { S as SiteNavData } from './types-Bzws8ncP.js';

/**
 * **The packaged public entry page** — the host half of ADR-0209's renderer, shipped (ADR-0213 §3).
 *
 * `resources/js/pages/site/entry.tsx` existed FIVE times before this file: 84 byte-identical lines in
 * each of three starters, 262 independently grown on `splicewire/www`, 285 in `splicewire-app`. The
 * three long copies had each re-derived the artifact loader, and two of them still carried the version
 * of it that predates `<EntryBody>` — including an `<MDXProvider>` wrapper that is inert, because the
 * compiler runs without `providerImportSource` and the body takes its components as a prop. That is
 * ticket 11's rule with five instances: a fix written at the host is a fix the next host needs again.
 *
 * A host resolves Inertia pages from its own `import.meta.glob` first and this map second, so
 * *overriding* is still "put a file at `pages/site/entry.tsx`" — no publish step and no opt-out flag —
 * and *taking the default* is deleting that file.
 *
 * ## Where the host's half arrives from
 *
 * Not from props: the server composes those. Everything host-shaped — the component map, the router's
 * `<Link>`, the providers, the chrome slots, the classes carrying the palette — comes through
 * {@link configureEntryPage}, called once in `app.tsx`. See `../docs/config.ts` for why that is the
 * only channel available.
 *
 * ## Chrome
 *
 * `entry.layout` / `entry.template` arrive RESOLVED (the server walked the containment chain it was
 * already holding). A name resolves against the registry first, then as **another entry's slug** (§7)
 * — for which the server also sends that entry's artifact address under `chrome`, and the page nests
 * it ({@link ArtifactChrome}). A name that is neither falls back rather than crashing, and
 * `BeamUxChromeAudit` is what names it — a page that 500s because someone typo'd a layout is a worse
 * failure than one that renders plainly and is reported.
 *
 * The entry half was declared in the ADR, promised by the audit, and absent from this page for its
 * first month: the audit passed `www`'s five `layout: site` rows by slug while this line read the
 * registry and fell through to nothing (beam-docs-satellite 55). A declared resolution with no
 * consumer is the estate's most expensive shape, so the consumer is here rather than a wider audit.
 *
 * The template default is `ProseTemplate`, which is what all five copies did with a className list.
 * The layout default is *nothing*: today's hosts wrap this page in their own `SiteLayout` through
 * `app.tsx`, so defaulting to `DocsLayout` would put a docs rail on a marketing page on every host
 * that upgrades.
 *
 * ## The page-props passthrough (§6)
 *
 * A compiled artifact is a static module addressed by body hash, so there is nowhere in it for a
 * per-request value and a screen component fetches its own data. The escape hatch for the cases where
 * a round trip is silly (the current user) is that the whole Inertia page-props object reaches the
 * body under one well-known name — `page`.
 */
type SiteEntryProps = {
    entry: EntryPayload;
    artifact: EntryArtifactPayload;
    nav: SiteNavData | null;
    /** Artifact addresses for chrome that resolved to another entry (§7). Absent from older servers. */
    chrome?: ChromeArtifactsPayload | null;
    /** Whatever else the host shares (auth, ziggy, flash) — passed through to the body under `page`. */
    [key: string]: unknown;
};
declare function SiteEntry(props: SiteEntryProps): react.JSX.Element;

/**
 * `@splicewire/beam-ux/pages` — the **page map** (ADR-0213 §3).
 *
 * Inertia resolves pages from a HOST-local `import.meta.glob('./pages/**\/*.tsx')`, and a package
 * cannot put a name into someone else's glob. Of the three ways to bridge that — the host publishes
 * the file (which is what produced five copies of one page), a Vite plugin merges package globs, or a
 * fallback resolver — this is the fallback resolver, and it is a plain object:
 *
 * ```ts
 * import { beamUxPages } from '@splicewire/beam-ux/pages';
 *
 * const own = import.meta.glob('./pages/**\/*.tsx');
 *
 * createInertiaApp({
 *     resolve: (name) => {
 *         const local = own[`./pages/${name}.tsx`];
 *         return local ? local() : beamUxPages[name]();
 *     },
 *     // …
 * });
 * ```
 *
 * The consequences are all of them the point: the override mechanism is *"put a file at
 * `pages/site/entry.tsx`"* — no publish step, no opt-out flag, no build-tool magic, and it is what
 * hosts already do. A host that wants the default deletes its copy. And because it is an object rather
 * than a plugin, it works identically under any bundler and under SSR.
 *
 * The value is a lazy `() => import(...)` for the same reason the host's glob is: a host that never
 * renders an entry must not pay for the page's chunk.
 *
 * This is the ONE module in the package that imports `@inertiajs/react` (for `<Head>`). Everything the
 * page composes — the chrome, the registry, the body loader — lives in `/docs` and `/site` and stays
 * usable by a host that renders entries some other way entirely.
 */
declare const beamUxPages: Record<string, () => Promise<{
    default: ComponentType<never>;
}>>;

export { SiteEntry, type SiteEntryProps, beamUxPages };
