/** Zero-prop Inertia desktop adapter. Portable roster/window helpers stay in beam-ux/shell. */
import { MainframeOutlet, MainframeProvider } from '@schemastud/mainframe';
import { Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    buildAppsFromManifest, buildDesktopChrome, defaultGenericBinding, defaultSurfaceInjection,
    type DesktopChromeConfig, type RealmManifestEntry, type RealmSurfaceBinding,
} from '@splicewire/beam-ux/shell';
import '@schemastud/mainframe/os/shell.css';

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
        surfaceInjection: (title, route, render) => defaultSurfaceInjection(title, route, render, Link),
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
