/**
 * `DefaultOsDesktop` — a ready-to-mount OS desktop, no host wiring required. Reads the
 * server-resolved `realmManifest` Inertia prop, builds the app roster with an EMPTY `surfaceMap` by
 * default (every realm auto-surfaces — see {@see defaultGenericBinding}), and mounts the generic
 * `@schemastud/mainframe/os` chrome (dock, launcher, window manager). A host with zero bindings still
 * gets a real, working desktop the moment `laravel-beam-accounts`' default `/operator` route renders
 * this; a host that wants a REAL surface for a realm passes its own `surfaceMap` entry — the auto-
 * surface placeholder for that key just stops appearing.
 *
 * This is the package-shipped counterpart to what every consuming host (audiostud, most notably)
 * previously hand-authored from scratch as its own `shell-config.tsx` — the SAME
 * `buildAppsFromManifest`/`buildDesktopChrome`/`MainframeProvider`+`MainframeOutlet` wiring, promoted
 * here as an importable default instead of being re-derived per host.
 *
 * Deliberately minimal next to a bespoke host desktop: no mobile-narrow collapse, no app-first
 * unentitled fallback, no route-staging of the current page, no workspace persistence. Those are real,
 * legitimate host customizations layered ON TOP of this base (a host can always drop straight to
 * `buildAppsFromManifest`/`buildDesktopChrome` directly, as this component does, and add them) — this
 * component's whole job is "renders a working desktop with zero configuration," not "replaces a
 * product's bespoke OS shell."
 */
import { createMainframeRegistry, createSlotRegistry, MainframeOutlet, MainframeProvider } from '@schemastud/mainframe';
import type { Mainframe, MainframeInjection } from '@schemastud/mainframe';
import '@schemastud/mainframe/os/shell.css';
import { Link, router, usePage } from '@inertiajs/react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { buildAppsFromManifest, buildDesktopChrome } from './realm';
import type { DesktopChromeConfig, RealmManifestEntry, RealmSurfaceBinding } from './realm';

/**
 * The generic placeholder surface for a realm key with no `surfaceMap` binding — the auto-surface
 * affordance every consumer of `buildAppsFromManifest` must supply. Neutral (no host branding baked
 * in); a host overriding the look entirely just binds the realm key in its own `surfaceMap` instead.
 */
function DefaultGenericSurface({ entry }: { entry: RealmManifestEntry }) {
    return (
        <div
            style={{
                padding: 28,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#6b7280',
                background: '#f9fafb',
                height: '100%',
            }}
        >
            <div style={{ color: '#6366f1', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Realm auto-surfaced
            </div>
            <p style={{ maxWidth: '46ch', margin: 0 }}>
                The <b>{entry.title}</b> realm (<code>{entry.key}</code>) is registered but no surface
                component is bound to it yet. Bind one via this desktop&apos;s <code>surfaceMap</code>{' '}
                prop — until then it opens this placeholder.
            </p>
        </div>
    );
}

/** The default auto-surface binding: a neutral placeholder window, keyed off the manifest entry alone. */
export function defaultGenericBinding(entry: RealmManifestEntry): RealmSurfaceBinding {
    return {
        label: entry.title,
        route: entry.routeBase || '/',
        subtitle: 'Realm · unbound surface',
        accent: '#6b7280',
        geometry: { x: 240, y: 130, width: 640, height: 480 },
        render: () => <DefaultGenericSurface entry={entry} />,
    };
}

/**
 * A per-window error boundary. A real surface component that hard-crashes (typically because it needs
 * page-specific Inertia props the desktop only threads shared props for) degrades to a legible notice
 * INSIDE its window, with a link to the live route — never a silent blank window.
 */
class SurfaceBoundary extends Component<{ title: string; route: string; children: ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[beam-ux/shell] surface "${this.props.title}" threw`, error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        padding: 28,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: '#6b7280',
                        background: '#f9fafb',
                        height: '100%',
                    }}
                >
                    <div style={{ color: '#dc2626', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                        Surface needs its page props
                    </div>
                    <p style={{ maxWidth: '46ch' }}>
                        The real <b>{this.props.title}</b> component crashed without its page-specific
                        Inertia props (the desktop threads only shared props). Open the live route to see
                        it in full:
                    </p>
                    <Link href={this.props.route} style={{ color: '#6366f1' }}>
                        open {this.props.route} ↗
                    </Link>
                    <pre style={{ marginTop: 14, whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(this.state.error.message)}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

const surfaceMainframe: Mainframe = ({ slots }) => (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>{slots.main()}</div>
);

/** The default nested-window fill: frames `render()` in a `SurfaceBoundary`, no other chrome. */
export function defaultSurfaceInjection(title: string, route: string, render: () => ReactNode): MainframeInjection {
    const slots = createSlotRegistry();
    const mainframes = createMainframeRegistry();
    mainframes.register('surface', surfaceMainframe);
    slots.contribute({
        slot: 'main',
        key: `surface:${title}`,
        render: () => (
            <SurfaceBoundary title={title} route={route}>
                {render()}
            </SurfaceBoundary>
        ),
    });

    return { slots, mainframes };
}

export interface DefaultOsDesktopProps {
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

function DefaultBrand() {
    return <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>beam</span>;
}

/** Mounts `DefaultOsDesktop` with everything wired: manifest read, roster build, chrome, window host. */
export function DefaultOsDesktop({ surfaceMap = {}, exclude, brand, status, backdrop, onNavigate, chrome }: DefaultOsDesktopProps) {
    const manifest = (usePage<{ realmManifest?: RealmManifestEntry[] }>().props.realmManifest as RealmManifestEntry[] | undefined) ?? [];

    const apps = buildAppsFromManifest(manifest, {
        surfaceMap,
        exclude,
        genericBinding: defaultGenericBinding,
        surfaceInjection: defaultSurfaceInjection,
    });

    const osInjection = buildDesktopChrome({
        apps,
        brand: brand ?? <DefaultBrand />,
        status,
        backdrop,
        launcherHeading: 'Realms',
        onNavigate: onNavigate ?? ((app) => router.visit(app.route ?? '/')),
        ...chrome,
    });

    const initialOpen = apps
        .filter((a) => !a.locked)
        .slice(0, 3)
        .map((a) => a.key);

    return (
        <MainframeProvider injection={osInjection}>
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
                <MainframeOutlet mode="os" ctx={{ os: { apps, initialOpen } }} />
            </div>
        </MainframeProvider>
    );
}
