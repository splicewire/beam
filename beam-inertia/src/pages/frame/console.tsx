import { Head } from '@inertiajs/react';
import { BrowserRouter } from 'react-router';
import { useFrameManifest } from '../../frame/manifest';
import { TenantFrameProvider } from '../../frame/provider';
import {
    DefaultFrameRealm,
    FrameRealmProvider,
    useFrameRealm,
    type FrameRealmContext,
} from '../../frame/realm';
import { FrameRoutes } from '../../frame/router';

/**
 * The frame console — one Inertia page serving every frame path of ONE REALM.
 *
 * The server mounts this component at each path `RouteContextProjector::hrefs($realm)` declares
 * (routes/web.php), so an Inertia visit to `/beam-ux-entry` lands here and the client router matches
 * the leaf. That is the whole reason the page takes no `resource` prop: which surface renders is the
 * MANIFEST's decision, read from the same `routeContext` the nav's hrefs were derived from, rather
 * than a second server-side mapping that could drift from it.
 *
 * `<BrowserRouter>` is here for matching and `:id` params only — navigation is Inertia's (see
 * `frame/router.tsx`).
 *
 * ## It used to be the TENANT console, and only that
 *
 * Measured on fresh-tower.test 2026-09-11: the operator realm's four projected paths all 404'd, and
 * mounting them made this page render "No surface here". This component fetched a hardcoded
 * `/frame/manifest` and mounted `<BrowserRouter>` with no basename, while the realm's `routeContext`
 * paths are realm-RELATIVE (`users`) and its nav hrefs realm-PREFIXED (`/operator/users`) — so one
 * host could serve exactly ONE realm however many it declared. The server half was already right
 * (`NavManifest::realmFor()` reads the mount's `defaults['realm']`).
 *
 * The three props are that fact, passed by the mount that knows it, and they DEFAULT to the tenant
 * values — so an existing `Inertia::render('frame/console')` with no props is unchanged.
 */
export default function FrameConsole(props: Partial<FrameRealmContext>) {
    const realm = props.realm ?? DefaultFrameRealm.realm;
    const basename = props.basename ?? DefaultFrameRealm.basename;
    const manifestUrl = props.manifestUrl ?? DefaultFrameRealm.manifestUrl;

    return (
        <FrameRealmProvider realm={realm} basename={basename} manifestUrl={manifestUrl}>
            {/* The provider reads the manifest, so it has to sit INSIDE the realm context. */}
            <TenantFrameProvider>
                <BrowserRouter basename={basename}>
                    <ConsoleBody />
                </BrowserRouter>
            </TenantFrameProvider>
        </FrameRealmProvider>
    );
}

function ConsoleBody() {
    const { manifestUrl } = useFrameRealm();
    const { data: manifest, isLoading, error } = useFrameManifest();

    if (isLoading) {
        return (
            <div className="px-6 py-8 text-sm text-muted-foreground">
                <Head title="Console" />
                Loading the frame manifest…
            </div>
        );
    }

    if (error || !manifest) {
        return (
            <div className="px-6 py-8">
                <Head title="Console" />
                <h1 className="mb-1 text-2xl font-semibold">
                    The frame manifest did not load
                </h1>
                <p className="max-w-prose text-sm text-muted-foreground">
                    {/* Names the URL this console actually asked for. The old copy said
                        "GET /frame/manifest failed." in every realm, which is a wrong URL in a
                        message whose only job is to name the request that failed. */}
                    {error instanceof Error
                        ? error.message
                        : `GET ${manifestUrl} failed.`}
                </p>
            </div>
        );
    }

    return (
        <>
            <Head title="Console" />
            <FrameRoutes manifest={manifest} />
        </>
    );
}
