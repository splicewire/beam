import type {
    ContextManifest,
    FormMode,
    ManifestLookup,
    RouteContextEntry,
} from '@schemastud/frame';
import { useFrameRealm } from './realm';
import { useQuery } from '@tanstack/react-query';
import { jsonHeaders } from './xsrf';

/**
 * The four keys `GET /frame/manifest` emits. `resources` + `contexts` come from frame itself;
 * `nav` + `routeContext` are the projection `splicewire/laravel-beam-ux` contributes over this host's
 * own `config('frame.realms')` membership list.
 *
 * ⚠️ `routeContext[].routeName` values are CLIENT-router identities (`beam-ux-entry.index`), NOT
 * Laravel named routes. Do not hand one to a URL helper — the join from a name to a URL is
 * `RouteContextProjector::hrefs()` server-side and `nav[].href` on the wire.
 */
export interface ManifestResource {
    key: string;
    creatable: boolean;
    editable: boolean;
    deletable: boolean;
    showable: boolean;
    form?: FormMode;
    nav: {
        label: string;
        group: string | null;
        icon: string | null;
        section?: string | null;
    };
}

export interface FrameNavNode {
    kind: string;
    title: string;
    href: string | null;
    icon: string | null;
    routeName: string | null;
    locked: unknown;
    children: FrameNavNode[];
}

export interface FrameManifest {
    resources: ManifestResource[];
    contexts: Record<string, ContextManifest>;
    nav: { items: FrameNavNode[] };
    routeContext: RouteContextEntry[];
}

async function fetchManifest(url: string): Promise<FrameManifest> {
    const res = await fetch(url, {
        headers: jsonHeaders(),
        credentials: 'same-origin',
    });

    if (!res.ok) {
        // Names the URL, not just the status. With one manifest per realm, `manifest 403` no longer
        // identifies WHICH manifest refused — and a 403 here is now an expected answer (a member
        // reaching an operator-realm console), so the message is the only thing that tells them apart.
        throw new Error(`GET ${url} failed (${res.status}).`);
    }

    const body = (await res.json()) as Partial<FrameManifest>;

    return {
        resources: body.resources ?? [],
        contexts: body.contexts ?? {},
        nav: body.nav ?? { items: [] },
        routeContext: body.routeContext ?? [],
    };
}

/**
 * The registered-resource roster, the nav tree and the router table — one fetch, shared by all three.
 *
 * Realm-scoped through {@see useFrameRealm}. Both halves matter and neither is decoration:
 *
 *  - the URL, because a host mounts `FrameManifestController` ONCE PER REALM (`NavManifest::realmFor()`
 *    reads the route's `defaults['realm']`), so the realm is carried by WHICH route you call, not by a
 *    parameter on one route;
 *  - the cache key, because `['frame','manifest']` is one entry for a whole page. An operator console
 *    opened after a tenant one would have been served the tenant manifest out of cache — the wrong
 *    surface, with no request to show for it.
 *
 * Unwrapped (no console around it) the context defaults to `/frame/manifest` and a null realm, which
 * is exactly what this hook did before, so `components/nav-frame.tsx` and `frame/provider.tsx` in a
 * layout outside any console are unchanged.
 */
export function useFrameManifest() {
    const { realm, manifestUrl } = useFrameRealm();

    return useQuery({
        queryKey: ['frame', 'manifest', ...(realm === null ? [] : [realm])],
        queryFn: () => fetchManifest(manifestUrl),
        staleTime: 60_000,
    });
}

/**
 * Another resource's context manifest, by key — frame's `ManifestLookup`, built ONCE here and handed
 * to both of its consumers: the mount dispatcher's `manifestFor` option (`router.tsx`) and the
 * injection's `manifestFor` (`provider.tsx`, realm-dashboards ticket 04). One definition, so a
 * `dashboard-card` resolving a row's TARGET resource and a dispatched leaf resolving its OWN read the
 * same table. `undefined` is the ordinary answer while the manifest is in flight and for a resource
 * this host does not mount — the card drops, never throws.
 */
export function manifestLookup(manifest: FrameManifest | undefined): ManifestLookup {
    return (resource) => manifest?.contexts[resource];
}

/** A resource's declared `form` mode, for the mount dispatcher's `formFor` lookup. */
export function formFromManifest(
    manifest: FrameManifest | undefined,
    resourceKey: string,
): FormMode | undefined {
    return manifest?.resources.find((r) => r.key === resourceKey)?.form;
}

/** The label a resource's nav seat declares, so a generic page can title itself without hardcoding. */
export function labelFromManifest(
    manifest: FrameManifest | undefined,
    resourceKey: string,
): string {
    return (
        manifest?.resources.find((r) => r.key === resourceKey)?.nav.label ??
        resourceKey
    );
}
