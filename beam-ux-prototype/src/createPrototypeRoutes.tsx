import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import type { Cn } from './cn';
import { NAMESPACE_DEFAULT, parsePrototypePath } from './discovery';

/**
 * The glob→route mount utility — the heart of the rushing-prototype runtime (ADR-0116).
 *
 * A host writes ONE line — `import.meta.glob<Record<string, unknown>>('../_prototype/**​/*.tsx')`
 * — and passes the result here. That glob is a Vite compile-time macro resolved AT THE CALL SITE;
 * it CANNOT live inside this package (the load-bearing seam). Everything around it — the
 * `_`-prefixed-dir filter, the flat-slug parse, the `*Prototype`-or-default lazy resolve (all in the
 * shared `discovery` grammar) — is what this function carries, so it stops being copy-pasted runtime
 * in every repo.
 *
 * The host keeps the `import.meta.env.DEV ? [...] : []` guard around the call so the whole branch
 * (and its lazily-imported chunks) tree-shakes out of production — asserted by the packaged
 * `beam-verify-prototype-boundary` CLI.
 */

/** The shape of a lazy (non-eager) `import.meta.glob` result: path → module loader. */
export type PrototypeGlob = Record<string, () => Promise<Record<string, unknown>>>;

export interface CreatePrototypeRoutesOptions {
    /** Route namespace the prototypes mount under. Default `/_prototype`. */
    namespace?: string;
    /**
     * Auto-mount the `Gallery` index at the namespace root (`/_prototype`). Default `true` — a host
     * gets the clickable index for free. Set `false` to mount your own index route.
     */
    gallery?: boolean;
    /** Override the bundled `cn` — threaded into the auto-mounted `Gallery`. */
    cn?: Cn;
}

/**
 * Build the `RouteObject[]` for every auto-discovered prototype (+ the gallery index by default).
 *
 * @param glob  the host's `import.meta.glob` result (lazy, non-eager).
 * @param opts  `namespace` (default `/_prototype`), `gallery` (default true), `cn` override.
 */
export function createPrototypeRoutes(
    glob: PrototypeGlob,
    opts: CreatePrototypeRoutesOptions = {},
): RouteObject[] {
    const namespace = opts.namespace ?? NAMESPACE_DEFAULT;
    const withGallery = opts.gallery ?? true;

    const prototypeRoutes = Object.entries(glob).flatMap(([path, load]): RouteObject[] => {
        // `_`-prefixed subdirs (_chrome, _fixtures) hold shared chrome + fixtures, not prototypes.
        const { slug, isExcluded } = parsePrototypePath(path);
        if (isExcluded) return [];
        return [
            {
                path: `${namespace}/${slug}`,
                lazy: async () => {
                    const mod = await load();
                    // Prefer a named `*Prototype` export; fall back to the default.
                    const named = Object.entries(mod).find(([k]) => k.endsWith('Prototype'));
                    return {
                        Component: (named?.[1] ?? mod.default) as ComponentType,
                    };
                },
            },
        ];
    });

    if (!withGallery) return prototypeRoutes;

    // The clickable index at the namespace root. Lazily imported so `Gallery` (+ its shadcn deps)
    // stays out of the host's entry chunk and tree-shakes cleanly when this whole call sits in the
    // host's `import.meta.env.DEV` dead branch.
    const galleryRoute: RouteObject = {
        path: namespace,
        lazy: async () => {
            const { Gallery } = await import('./Gallery');
            return {
                Component: () => <Gallery glob={glob} namespace={namespace} cn={opts.cn} />,
            };
        },
    };

    return [galleryRoute, ...prototypeRoutes];
}
