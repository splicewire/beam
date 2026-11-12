import type { FrameManifest as FrameKitManifest, FormMode } from '@schemastud/frame';
import { kitFor } from './kit';
import { useFrameRealm } from './realm';

/**
 * One node of the `nav` tree `splicewire/laravel-beam-ux` contributes to a realm's manifest,
 * projected over this host's own `config('frame.realms')` membership list.
 *
 * ⚠️ `routeName` values are CLIENT-router identities (`beam-ux-entry.index`), NOT Laravel named
 * routes. Do not hand one to a URL helper — the join from a name to a URL is
 * `RouteContextProjector::hrefs()` server-side and `href` on the wire.
 */
export interface FrameNavNode {
    kind: string;
    title: string;
    href: string | null;
    icon: string | null;
    routeName: string | null;
    locked: unknown;
    /** The zone a top-level node is drawn in (ux-walkthrough M4): `primary` is the rail, `meta` the Developer zone. */
    zone?: 'primary' | 'meta' | null;
    children: FrameNavNode[];
}

/** The `nav` this host's manifest carries. */
export type FrameNav = { items: FrameNavNode[] };

/** Frame's manifest with this host's `nav` named. */
export type FrameManifest = FrameKitManifest<FrameNav>;

/**
 * The registered-resource roster, the nav tree and the router table, read through the surrounding
 * realm's kit, so the provider, the rail, the console and the entry-properties form share one
 * cache entry per realm.
 *
 * Realm-scoped through {@see useFrameRealm}: a host mounts `FrameManifestController` ONCE PER REALM
 * (`NavManifest::realmFor()` reads the route's `defaults['realm']`), so the realm is carried by WHICH
 * URL you call. The kit is per manifest URL and its cache key carries that URL, so an operator
 * console opened after a tenant one is never served the tenant manifest out of cache.
 *
 * Unwrapped (no console around it) the realm defaults to `/frame/manifest`, so the rail and the
 * provider in a layout outside any console read the root manifest.
 */
export function useFrameManifest() {
    return kitFor(useFrameRealm().manifestUrl).useManifest();
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
