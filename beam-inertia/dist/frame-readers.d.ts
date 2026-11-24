import * as react from 'react';
import { FrameManifest as FrameManifest$1, FormMode } from '@schemastud/frame';

/**
 * The realm rail (ux-walkthrough UX-12a, M7): the frame manifest's projected `nav`, drawn by the packaged `RealmNav`.
 * It replaces the starter's hand-rolled NavFrame, so both shells (this Inertia one and the flagship SPA) render one
 * component. Active state is stamped here from the current URL, because the manifest is fetched once and cached across
 * Inertia visits. `zone: meta` nodes leave the rail for the Developer zone, which RealmNav draws after it as seat
 * groups (the behaviour NavFrame gained in c4622dc).
 */
declare function FrameRail({ omitHrefs }?: {
    omitHrefs?: string[];
}): react.JSX.Element | null;

/**
 * One node of the `nav` tree `splicewire/laravel-beam-ux` contributes to a realm's manifest,
 * projected over this host's own `config('frame.realms')` membership list.
 *
 * ⚠️ `routeName` values are CLIENT-router identities (`beam-ux-entry.index`), NOT Laravel named
 * routes. Do not hand one to a URL helper — the join from a name to a URL is
 * `RouteContextProjector::hrefs()` server-side and `href` on the wire.
 */
interface FrameNavNode {
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
type FrameNav = {
    items: FrameNavNode[];
};
/** Frame's manifest with this host's `nav` named. */
type FrameManifest = FrameManifest$1<FrameNav>;
/** A resource's declared `form` mode, for the mount dispatcher's `formFor` lookup. */
declare function formFromManifest(manifest: FrameManifest | undefined, resourceKey: string): FormMode | undefined;
/** The label a resource's nav seat declares, so a generic page can title itself without hardcoding. */
declare function labelFromManifest(manifest: FrameManifest | undefined, resourceKey: string): string;

declare function FrameRoutes({ manifest }: {
    manifest: FrameManifest;
}): react.ReactElement<unknown, string | react.JSXElementConstructor<any>> | null;

declare const _default: {
    'manifest:nav': typeof FrameRail;
    'manifest:routeContext': typeof FrameRoutes;
    'resource-entry:editable': typeof FrameRoutes;
    'resource-entry:form': typeof formFromManifest;
    'resource-entry:key': typeof formFromManifest;
    'resource-entry:nav': typeof labelFromManifest;
    'resource-entry:nav.label': typeof labelFromManifest;
    'resource-entry:showable': typeof FrameRoutes;
};

export { _default as default };
