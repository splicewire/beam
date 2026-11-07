import { ReactNode } from 'react';
import { DesktopUpsell, DesktopApp } from '@schemastud/mainframe/os';
export { Clock, DesktopApp, DesktopChromeConfig, DesktopUpsell, Dock, Launcher, OperatorOverlay, OperatorOverlayProps, OverlayWindow, UpsellPopover, WindowManager, WorkspacePersistence, buildDesktopChrome, useWindowManager } from '@schemastud/mainframe/os';
import { MainframeInjection } from '@schemastud/mainframe';
import { L as LinkComponent } from './types-Bzws8ncP.js';

/**
 * `@splicewire/beam-ux/shell` — the REALM-AWARE layer over the schemastud desktop chrome
 * (editor-promotion ticket 07 / ADR-0017).
 *
 * The generic desktop CHROME (dock / launcher / clock / upsell / persistence / window manager +
 * operator overlay) lives realm-agnostic in `@schemastud/mainframe/os` (`buildDesktopChrome`,
 * `OperatorOverlay`, `DesktopApp`, `useWindowManager`, …). This module is the THIN beam layer that
 * COMPUTES the chrome's `DesktopApp[]` from the server-resolved realm MANIFEST — the piece that knows
 * about realms, entitlement gating (locked/upsell), and auto-surfacing. It is the only place a manifest
 * type lives; the chrome never sees one.
 *
 * History: this subpath used to ship its OWN `<Shell>` component + a DUPLICATE `windowManager.ts`
 * reducer (beam-ux-uplift ticket 11). That shell was ORPHANED — the live product rode
 * `@schemastud/mainframe/os` instead — so the duplicate reducer + component are retired here and this
 * subpath is re-based onto the canonical window manager (ADR-0017).
 */

/**
 * One projected realm from the server manifest (the `RealmManifestProjector` shape). Present ⇒ the
 * principal may reach it (HARD-gated realms are absent by construction); `locked` ⇒ soft-gated (a
 * locked tile + upsell). This is THE manifest type — it lives ONLY here, never in the chrome tier.
 */
type RealmManifestEntry = {
    key: string;
    title: string;
    routeBase: string;
    locked: boolean;
    upsell?: DesktopUpsell | null;
};
/**
 * How a realm key binds to its OS surface: the chrome (label/accent/geometry/subtitle/route) + the real
 * component to frame. The HOST supplies this map (it's the one place a realm key couples to a page
 * component). Realm-agnostic downstream: the built `DesktopApp` carries only generic fields.
 */
type RealmSurfaceBinding = {
    /** Fallback title when the manifest carries none (the manifest title wins). */
    label: string;
    route: string;
    subtitle: string;
    accent: string;
    geometry: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** The REAL page component to frame in the window. */
    render: () => ReactNode;
};
/** Host-supplied policy for turning a manifest into a desktop-app roster. */
interface BuildAppsOptions {
    /** The realm-key → surface binding map (the host's `SURFACE_MAP`). */
    surfaceMap: Record<string, RealmSurfaceBinding>;
    /** Realm keys the host does NOT surface as OS apps (e.g. a DAW reached by nav, not a launchable). */
    exclude?: Set<string>;
    /** The fallback binding for an unmapped realm key — the auto-surface affordance. */
    genericBinding: (entry: RealmManifestEntry) => RealmSurfaceBinding;
    /**
     * Build the window's nested Mainframe injection from its title/route/render. The host owns this
     * (it composes the surface into a nested Mainframe scope). Produces the `OsWindowSpec` fill.
     */
    surfaceInjection: (title: string, route: string, render: () => ReactNode) => DesktopApp['injection'];
}
/**
 * Build the OS desktop-app roster from the server-resolved realm manifest. THE realm-aware seam: the
 * roster's DATA comes from the manifest, its surface COMPONENTS from the host's `surfaceMap` (with an
 * auto-surface fallback), and its GATING straight off each entry's `locked`/`upsell`. Given an empty
 * manifest (guest/degraded), returns `[]` — an empty dock, never a crash.
 *
 * The output is a flat `DesktopApp[]` the realm-agnostic `buildDesktopChrome` reads — no manifest type
 * crosses the tier boundary.
 */
declare function buildAppsFromManifest(manifest: RealmManifestEntry[], { surfaceMap, exclude, genericBinding, surfaceInjection }: BuildAppsOptions): DesktopApp[];

/** The default auto-surface binding: a neutral placeholder window, keyed off the manifest entry alone. */
declare function defaultGenericBinding(entry: RealmManifestEntry): RealmSurfaceBinding;
/** The default nested-window fill: frames `render()` in a `SurfaceBoundary`, no other chrome. */
declare function defaultSurfaceInjection(title: string, route: string, render: () => ReactNode, linkComponent?: LinkComponent): MainframeInjection;

export { type BuildAppsOptions, type RealmManifestEntry, type RealmSurfaceBinding, buildAppsFromManifest, defaultGenericBinding, defaultSurfaceInjection };
