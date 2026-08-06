// @splicewire/beam-ux/appshell — shared types for the promoted shell patterns (Frame OS ticket 19).
//
// Three router-neutral, host-injected patterns live here: the AppShell mode-switch + effectiveCan
// core, the section-layout / SectionBar shell-nesting mechanism, and the FrameSidePanelOverlay
// single-host-portal. NONE hardcodes a roster: the host supplies its contribution set / section
// rosters / manifest. NONE imports a router: link + outlet arrive as injected nodes.
import type { MainframeCan } from '@schemastud/mainframe';
import type { ReactNode } from 'react';

/**
 * The shell mode axis (ADR-0099). The host owns mode state and hands it to its `MainframeOutlet`;
 * switching swaps only the child Mainframe under the stable provider (a state-preserving child-swap
 * above the router outlet). The default triad matches splicewire-app (`desk` | `window` | `focus`),
 * but the core is generic over any string-union of modes.
 */
export type ShellMode = 'desk' | 'window' | 'focus';

/** A capability the effectiveCan gate can strip while a preview (e.g. view-as-visitor) is active. */
export type Capability = string;

/** The re-exported mainframe predicate type, so a host types its `can` off one import here. */
export type { MainframeCan };

// ── section-layout / SectionBar ─────────────────────────────────────────────────────────────────

/**
 * A sub-section / record / group tab. Purely presentational top-bar structure (id/path-bound), NOT
 * a left-nav menu item — the server nav owns the rail. `permission`/`demoOnly` let the host filter
 * a tab; the SectionBar renderer applies host-supplied visibility, it does not resolve entitlement.
 */
export interface SectionTab {
    /** Where the tab links. */
    path: string;
    /** Display label. */
    label: string;
    /** `end`-match the active state on the exact path (react-router `NavLink` `end`). */
    end?: boolean;
    /** A permission the host may gate on (the host supplies the predicate; the type is just a hint). */
    permission?: string;
    /** Demo-tenant-only tab (host supplies the `isDemo` signal). */
    demoOnly?: boolean;
}

/** A static second-level tab group under a section (matched by a route prefix). */
export interface SectionGroup {
    /** Route prefix that activates this group's second-level strip. */
    match: string;
    /** The group's tabs (rendered like record sub-tabs, with a divider). */
    tabs: SectionTab[];
}

/**
 * Top-bar section metadata — the hand-written chrome a SectionBar needs that is NOT the left-nav
 * model. The host authors the roster; the package supplies the path-resolution + rendering.
 */
export interface SectionMeta {
    /** Stable key (matches the server nav section key). */
    key: string;
    /** Display label for the breadcrumb root and the bare-section heading. */
    label: string;
    /** Where the section crumb links (its default landing path). */
    defaultPath: string;
    /** Route prefix used to detect "am I inside this section?". */
    match: string;
    /** Sub-section tabs shown in the top bar while browsing the section. */
    subSections?: SectionTab[];
    /** Record-scoped sub-tabs shown once drilled into a record (id-bound). */
    recordTabs?: (id: string) => SectionTab[];
    /** Static second-level tab groups (matched by a route prefix within the section). */
    groups?: SectionGroup[];
}

/**
 * A "meta" area (e.g. Settings) that lives OUTSIDE the work sections but folds its tabs into the
 * SAME top-bar sub-tab strip grammar. The host authors the roster; the package resolves + renders.
 */
export interface MetaArea {
    root: { label: string; path: string };
    match: string;
    tabs: { path: string; label: string }[];
}

/** One breadcrumb crumb for a meta area — a linking root plus the current (unlinked) leaf. */
export interface MetaCrumb {
    label: string;
    /** Present on the root crumb (a link); absent on the current-leaf crumb. */
    path?: string;
}

/**
 * The router link component the SectionBar renders each tab through — injected so the package
 * imports no router. Mirrors the nav `LinkComponent`: it takes `to`, an `end` hint, and the tab
 * children, and owns its own active styling (react-router `NavLink` render-prop, Inertia `Link`, …).
 */
export type SectionLinkComponent = (props: {
    to: string;
    end?: boolean;
    children: ReactNode;
    /** ARIA label for the surrounding nav (the renderer sets it on the `<nav>`, not the link). */
    className?: string;
}) => ReactNode;
