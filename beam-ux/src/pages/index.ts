import type { ComponentType } from 'react';

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
export const beamUxPages: Record<string, () => Promise<{ default: ComponentType<never> }>> = {
    'site/entry': () => import('./SiteEntry.js') as Promise<{ default: ComponentType<never> }>,
};

export { default as SiteEntry, type SiteEntryProps } from './SiteEntry.js';
