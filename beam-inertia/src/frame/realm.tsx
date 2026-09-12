import { usePage } from '@inertiajs/react';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Which realm this mounted Frame console is serving — the fact the packaged console never had.
 *
 * ## Why the client needed one at all
 *
 * The SERVER half has been realm-aware the whole time: `Schemastud\Frame\Registry\NavManifest::realmFor()`
 * reads the matched route's `defaults['realm']`, and its docblock states the intended shape outright —
 * *"a host mounts the same controller once per realm and the realm is a fact about the MOUNT, not
 * about the caller."* The client half had no counterpart. `pages/frame/console.tsx` fetched a
 * hardcoded `/frame/manifest` and mounted `<BrowserRouter>` with no basename, so one host could serve
 * exactly ONE realm's console however many realms it declared.
 *
 * Measured on fresh-tower.test 2026-09-11: `config('frame.realms')['operator']` names `users` and
 * `teams`, `RouteContextProjector::hrefs('operator')` duly projects `/operator/users`,
 * `/operator/users/:id`, `/operator/teams`, `/operator/teams/:id`, and all four 404'd because every
 * starter builds its `{frameRoute}` console from `hrefs('tenant')` alone. Mounting them made the
 * console serve and render **"No surface here"**: `routeContext[].path` is realm-RELATIVE (`users`)
 * while `nav[].href` is realm-PREFIXED (`/operator/users`), so at `/operator/users` a basename-less
 * router matched neither shape.
 *
 * ## Three values, passed by the mount, because the mount is what knows them
 *
 * Not derived here from `window.location`, and not fetched: api-surface-coherence 141 ruled SPELL IT
 * OUT for mounts, on the reasoning that every field a mount passes is a fact about an EXPOSURE, which
 * the route file owns. A host's `routes/web.php` already writes the realm literally three times
 * (`hrefs('operator')`, `contributeNav('operator')`, the segment regex); this is the fourth, and the
 * first one that reaches the browser.
 *
 * The defaults are today's values exactly — root manifest, no basename, no realm in the cache key —
 * so a tenant mount that passes nothing is byte-for-byte what it was.
 */
export interface FrameRealmContext {
    /** The realm key (`operator`, `tenant`, …), or null when the host mounts one unscoped console. */
    realm: string | null;
    /** The realm's `routeBase` — the `<BrowserRouter basename>` and the prefix an Inertia visit needs. */
    basename: string;
    /** Where this realm's manifest lives. A host mounts `FrameManifestController` once per realm. */
    manifestUrl: string;
}

export const DefaultFrameRealm: FrameRealmContext = {
    realm: null,
    basename: '/',
    manifestUrl: '/frame/manifest',
};

const FrameRealmCtx = createContext<FrameRealmContext>(DefaultFrameRealm);

export function FrameRealmProvider({
    realm = null,
    basename = DefaultFrameRealm.basename,
    manifestUrl = DefaultFrameRealm.manifestUrl,
    children,
}: Partial<FrameRealmContext> & { children: ReactNode }) {
    const value = useMemo<FrameRealmContext>(
        () => ({ realm, basename: normalizeBase(basename), manifestUrl }),
        [realm, basename, manifestUrl],
    );

    return <FrameRealmCtx.Provider value={value}>{children}</FrameRealmCtx.Provider>;
}

/**
 * The realm the surrounding console is serving.
 *
 * ## Two sources, and the page-prop one is not a fallback for tidiness
 *
 * The React context is the authority when a console has mounted one. But the console page is not the
 * only thing that reads the manifest: `components/nav-frame.tsx` renders the console's own RAIL and
 * `frame/provider.tsx` supplies its write capabilities, and both are mounted in the LAYOUT — above
 * the page, therefore outside any provider the page renders. Measured on fresh-tower.test
 * 2026-09-12, with only the context in place: `/operator/users` served the operator users roster
 * correctly while the rail beside it listed the TENANT realm's sections (Authoring → Entries,
 * Schemas; Ops → Files, Git Repos, Sitemap), because `NavFrame` had fetched `/frame/manifest`.
 *
 * Inertia's page props reach both levels, and the mount already passes exactly these three values, so
 * the layout reads them from there. Context first so a nested or test mount can still override.
 *
 * Defaulted rather than required throughout: a realm-less mount is the only kind that existed before
 * this file, and it must keep working.
 */
export function useFrameRealm(): FrameRealmContext {
    const context = useContext(FrameRealmCtx);
    const page = usePage() as { props?: Record<string, unknown> } | undefined;
    const props = page?.props ?? {};

    return useMemo<FrameRealmContext>(() => {
        if (context !== DefaultFrameRealm) {
            return context;
        }

        const realm = typeof props.realm === 'string' ? props.realm : DefaultFrameRealm.realm;
        const basename =
            typeof props.basename === 'string' ? props.basename : DefaultFrameRealm.basename;
        const manifestUrl =
            typeof props.manifestUrl === 'string'
                ? props.manifestUrl
                : DefaultFrameRealm.manifestUrl;

        return { realm, basename: normalizeBase(basename), manifestUrl };
    }, [context, props.realm, props.basename, props.manifestUrl]);
}

/** `/operator/` → `/operator`; `''` → `/`. React Router wants no trailing slash but does want a root. */
function normalizeBase(base: string): string {
    const trimmed = base.replace(/\/+$/, '');

    return trimmed === '' ? '/' : trimmed;
}

/**
 * Prefix a realm-RELATIVE path with the realm's base, for a server-side (Inertia) visit.
 *
 * React Router's basename is applied to its own matching and to its own `<Link>`s; an
 * `router.visit()` is Inertia's and goes to the server, so it needs the absolute path. That
 * asymmetry is the whole reason this helper exists rather than the router building one URL shape.
 */
export function realmHref(basename: string, path: string): string {
    const base = normalizeBase(basename);
    const relative = path.replace(/^\/+/, '');

    return base === '/' ? `/${relative}` : `${base}/${relative}`;
}

/**
 * Strip the realm's base off a realm-PREFIXED href, so it can be matched under the basename.
 *
 * The manifest carries both shapes and they are not interchangeable: `routeContext[].path` is
 * realm-relative and `nav[].href` is realm-prefixed (`RouteContextProjector::hrefs()` joins
 * `routeBase` + shell + path). In the tenant realm `routeBase` is `/`, the two coincide, and the
 * difference was invisible for as long as tenant was the only servable realm.
 */
export function realmRelative(basename: string, href: string): string {
    const base = normalizeBase(basename);

    if (base !== '/' && (href === base || href.startsWith(`${base}/`))) {
        return href.slice(base.length).replace(/^\/+/, '');
    }

    return href.replace(/^\/+/, '');
}
