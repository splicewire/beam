import * as react from 'react';
import { ComponentType, SVGAttributes, ReactNode } from 'react';
import { UxBuilderClient } from '@splicewire/beam-ux';
import { InertiaLinkProps } from '@inertiajs/react';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import { RealmSurfaceBinding, DesktopChromeConfig } from '@splicewire/beam-ux/shell';

type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};
type Auth = {
    user: User;
};

/**
 * The install's brand as the host shares it (`brand`, laravel-beam's M8 `BrandData` through `Brand::for()`;
 * ux-walkthrough IA-14). The shell renders these fields and spells no brand of its own.
 */
type Brand = {
    name: string;
    logo: string | null;
    titleTemplate: string | null;
    legalEntity: string | null;
    passkeyCopy: string;
};

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}
declare module '@inertiajs/core' {
    interface InertiaConfig {
        sharedPageProps: {
            name: string;
            brand: Brand;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

type AuthFeature = "registration" | "email-verification" | "2fa" | "passkeys" | "password-confirmation" | "2fa-or-passkeys";
type PageModule = {
    default: ComponentType;
};
type PageLoader = () => Promise<PageModule>;
interface BeamInertiaConfig {
    name?: string;
    development?: boolean;
    logo?: ComponentType<SVGAttributes<SVGElement>>;
    features?: Partial<Record<AuthFeature, boolean>>;
    pages?: Record<string, PageLoader>;
    entryClient?: UxBuilderClient;
    /** Host-owned editor route for an inspected entry; absent means no Open Theme link. */
    fileEditorHref?: (entryId: string) => string | undefined;
}
declare function configureBeamInertia(config: BeamInertiaConfig): void;
declare function featureEnabled(feature: AuthFeature): boolean;
declare function authFeaturesFrom(enabled: readonly AuthFeature[]): Record<AuthFeature, boolean>;

declare function resolveBeamPage(name: string): Promise<PageModule['default']>;

declare function AuthLayout({ title, description, children, }: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}): react.JSX.Element;

type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

/**
 * The operator realm's app chrome: the ordinary `AppLayout` sidebar, with its frame rail and its
 * Dashboard item scoped to the operator realm (otb-ui-frontier-sidebar DESIGN-01, "Want 2").
 *
 * Before this, `operator/*` resolved to `[OsLayout, MainframeHost]` — the only realm with neither its
 * own chrome nor `AppLayout` — so the landing was a bare page, while the operator realm's nav was
 * projected at `/operator/frame/manifest` and rendered nowhere.
 *
 * The realm is scoped to the SIDEBAR, not provided around `children`: the page below keeps reading its
 * own realm (its props, or the tenant default), exactly as it did with no layout at all.
 *
 * Mounted ONLY by the layout switch in `index.tsx`, never by a page — see the float invariant there.
 */
declare function OperatorLayout({ breadcrumbs, children }: AppLayoutProps): react.JSX.Element;

declare const buttonVariants: (props?: ({
    variant?: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
    size?: "default" | "icon" | "sm" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Button({ className, variant, size, asChild, ...props }: react.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): react.JSX.Element;

declare const bodyClient: UxBuilderClient;

/**
 * The wire shapes of `splicewire/laravel-satellite`'s platform-connection surface.
 *
 * Hand-mirrored rather than imported, and that is a boundary decision: `@splicewire/beam-inertia` is
 * a JS package with no PHP dependency, and the generated DTO projection (`generated.d.ts`) lives in
 * each HOST's tree, not in a shared package. So the seam is stated here once, structurally, and the
 * host — whose generated types DO carry the server's declarations — is where a divergence surfaces
 * when it threads its page props into `<PlatformConnectionPanel>`.
 *
 * Every field here is a projection of a declared Data class:
 * `Splicewire\Satellite\Pairing\Data\PlatformConnectionData`,
 * `…\PlatformIdentityData` and `…\PlatformConnectionHealthData`.
 */
/** Mirrors `Splicewire\Satellite\Pairing\PlatformConnectionState`. */
type PlatformConnectionState = 'unpaired' | 'pending' | 'paired' | 'denied' | 'expired' | 'revoked';
type PlatformIdentity = {
    id: string;
    name: string | null;
    email: string | null;
};
/**
 * Mirrors `PlatformConnectionHealthData`: the satellite's one status line about its pairing (ux-walkthrough UX-04).
 * It carries no capability rows; the facet listing is the developer command `splicewire:connect --check`.
 */
type PlatformConnectionHealth = {
    ok: boolean;
    status: number | null;
    checkedAt: string;
    error: string | null;
};
type PlatformConnection = {
    state: PlatformConnectionState;
    tokenPresent: boolean;
    platformUrl: string | null;
    centralUrl: string | null;
    label: string | null;
    /**
     * The human half of the RFC 8628 grant — the code the operator reads to the tower's approval
     * screen. The DEVICE code, which is the credential half, is deliberately never projected;
     * `PlatformConnectionData`'s docblock carries the reasoning.
     */
    userCode: string | null;
    verificationUri: string | null;
    verificationUriComplete: string | null;
    expiresAt: string | null;
    identity: PlatformIdentity | null;
    identityError: string | null;
};
/**
 * Where the four declared `#[ParticleOp]`s mounted at this host.
 *
 * Threaded from the server rather than composed in the browser, because the mount point is the
 * HOST's choice: `Route::splicewirePlatformConnectionRoutes()` takes a prefix, so this package
 * cannot know whether the ops live under `/operator/` or somewhere else, and a hardcoded path here
 * would be a second, silently-wrong authority on a URL the route table already owns.
 */
type PlatformConnectionEndpoints = {
    connect: string;
    poll: string;
    check: string;
    disconnect: string;
};

/**
 * The transport seam for the platform-connection panel.
 *
 * A named port rather than a `fetch` call inline, for the reason the tokens surface already
 * established: a host with its own client runtime (interceptors, an operator tier, an axios
 * instance) substitutes it, and the panel's tests drive it without a network.
 */
type PlatformConnectionClient = {
    connect(label: string | null): Promise<PlatformConnection>;
    poll(): Promise<PlatformConnection>;
    check(): Promise<PlatformConnectionHealth>;
    disconnect(): Promise<PlatformConnection>;
};
declare function createPlatformConnectionClient(endpoints: PlatformConnectionEndpoints): PlatformConnectionClient;

/**
 * The operator-realm "Splicewire connection" surface: the whole satellite half of an RFC 8628 pairing,
 * as something an operator can drive without a terminal. Whether the pairing works is one health line
 * behind "Check connection" (ux-walkthrough UX-04); what it can reach is the developer command
 * `splicewire:connect --check`, not product.
 *
 * ## What it is NOT
 *
 * It is not a replacement for `php artisan splicewire:connect`. Both spend the same device-flow
 * client and both write the same `.env` key, so a site paired from the CLI shows as paired here and
 * can be disconnected here — and vice versa. The CLI stays the supported headless path.
 *
 * ## The six states, and why each is its own branch
 *
 * The temptation is two branches ("paired" / "not paired") with copy that hedges. That collapses the
 * three states an operator has to tell apart to know what to DO:
 *
 * - **denied** — someone said no at the tower. Retry is the move; the satellite is fine.
 * - **expired** — nobody answered in time. Retry is also the move, but nothing was refused, and
 *   saying "denied" here would send an operator to ask a colleague why they rejected it.
 * - **revoked** — a credential that DID work has been revoked at the tower. The satellite still
 *   holds it and it still looks valid; only a spent request discovered the refusal. Re-pairing is
 *   the move, and "unpaired" would hide that a stale credential is still sitting in `.env`.
 *
 * ## The polling loop
 *
 * A browser cannot block on the grant, so the pending state polls the server's single-tick `poll`
 * operation at the interval RFC 8628 asked for. It stops on ANY terminal state and on unmount; the
 * ref-guard is what keeps a late response from a cancelled pairing out of the rendered state.
 */
type Props = {
    connection: PlatformConnection;
    endpoints: PlatformConnectionEndpoints;
    /** Substitutable for hosts with their own client runtime, and for tests. */
    client?: PlatformConnectionClient;
    /** How often the pending state asks the server. RFC 8628's `interval` floor is 5s. */
    pollIntervalMs?: number;
};
declare function PlatformConnectionPanel({ connection: initial, endpoints, client: injected, pollIntervalMs, }: Props): react.JSX.Element;

interface DefaultOsDesktopProps {
    /** Realm-key → surface binding overrides. Unbound keys fall through to the auto-surface placeholder. */
    surfaceMap?: Record<string, RealmSurfaceBinding>;
    /** Realm keys to omit from the roster entirely. */
    exclude?: Set<string>;
    /** Menu-bar brand node. Defaults to a plain "beam" wordmark. */
    brand?: ReactNode;
    /** Menu-bar status node (clock, realm pill, …). */
    status?: ReactNode;
    /** Desktop backdrop node, rendered behind the window layer. */
    backdrop?: ReactNode;
    /** Realm key to navigate to on dock-tile click, e.g. `(app) => router.visit(app.route)`. */
    onNavigate?: DesktopChromeConfig['onNavigate'];
    /** Additional `buildDesktopChrome` overrides (launcher heading, launch label, persist, …). */
    chrome?: Partial<DesktopChromeConfig>;
}
/** Mounts `DefaultOsDesktop` with everything wired: manifest read, roster build, chrome, window host. */
declare function DefaultOsDesktop({ surfaceMap, exclude, brand, status, backdrop, onNavigate, chrome }: DefaultOsDesktopProps): react.JSX.Element;

/**
 * The host half of the PACKAGED entry page (ADR-0213 §3). `pages/site/entry.tsx` used to live here —
 * 84 lines, byte-identical in all three starters and independently grown to 262 and 285 on two real
 * hosts. The page now comes from `@splicewire/beam-ux/pages`, and everything only a host has arrives
 * through this one call, because an Inertia page's props come from the server and there is no other
 * channel from here into it.
 *
 * `wrap` is this site's chrome. Every public entry — the docs pages, a marketing page, a legal page —
 * renders inside `<SiteLayout>`, which is a fact about this HOST rather than about any one entry, so
 * it belongs here and not in an entry's `layout` column. An entry that wants the docs rail declares
 * `layout: DocsLayout` and gets it NESTED inside this.
 *
 * Putting a file back at `resources/js/pages/site/entry.tsx` overrides the packaged page outright —
 * the resolver below checks this host's own glob first. That is the whole override mechanism.
 */
declare function beamInertiaOptions(config?: BeamInertiaConfig): {
    title: (title: string) => string;
    /**
     * Own glob first, the package's page map second (ADR-0213 §3). Written out rather than left to
     * `@inertiajs/vite`'s injected resolver, because the injected one throws on a name it cannot find
     * in `./pages` and a package-contributed page is by definition not there.
     */
    resolve: typeof resolveBeamPage;
    layout: (name: string) => (typeof OperatorLayout)[] | typeof AuthLayout | null;
    strictMode: boolean;
    withApp(app: React.ReactNode): react.JSX.Element;
    progress: {
        color: string;
    };
};

export { type AuthFeature, type BeamInertiaConfig, Button, DefaultOsDesktop, type DefaultOsDesktopProps, type PageLoader, type PageModule, type PlatformConnection, type PlatformConnectionClient, type PlatformConnectionEndpoints, type PlatformConnectionHealth, PlatformConnectionPanel, type PlatformConnectionState, type PlatformIdentity, authFeaturesFrom, beamInertiaOptions, bodyClient, configureBeamInertia, createPlatformConnectionClient, featureEnabled, resolveBeamPage };
