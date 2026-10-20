import { MainframeCan, MainframeProps, MainframeContext, SlotRegistry } from '@schemastud/mainframe';
export { MainframeCan } from '@schemastud/mainframe';
import * as react from 'react';
import { ReactNode, ComponentType, ComponentProps } from 'react';

/**
 * The shell mode axis (ADR-0099). The host owns mode state and hands it to its `MainframeOutlet`;
 * switching swaps only the child Mainframe under the stable provider (a state-preserving child-swap
 * above the router outlet). The default triad matches splicewire-app (`desk` | `window` | `focus`),
 * but the core is generic over any string-union of modes.
 */
type ShellMode = 'desk' | 'window' | 'focus';
/** A capability the effectiveCan gate can strip while a preview (e.g. view-as-visitor) is active. */
type Capability = string;

/**
 * A sub-section / record / group tab. Purely presentational top-bar structure (id/path-bound), NOT
 * a left-nav menu item — the server nav owns the rail. `permission`/`demoOnly` let the host filter
 * a tab; the SectionBar renderer applies host-supplied visibility, it does not resolve entitlement.
 */
interface SectionTab {
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
interface SectionGroup {
    /** Route prefix that activates this group's second-level strip. */
    match: string;
    /** The group's tabs (rendered like record sub-tabs, with a divider). */
    tabs: SectionTab[];
}
/**
 * Top-bar section metadata — the hand-written chrome a SectionBar needs that is NOT the left-nav
 * model. The host authors the roster; the package supplies the path-resolution + rendering.
 */
interface SectionMeta {
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
interface MetaArea {
    root: {
        label: string;
        path: string;
    };
    match: string;
    tabs: {
        path: string;
        label: string;
    }[];
}
/** One breadcrumb crumb for a meta area — a linking root plus the current (unlinked) leaf. */
interface MetaCrumb {
    label: string;
    /** Present on the root crumb (a link); absent on the current-leaf crumb. */
    path?: string;
}
/**
 * The router link component the SectionBar renders each tab through — injected so the package
 * imports no router. Mirrors the nav `LinkComponent`: it takes `to`, an `end` hint, and the tab
 * children, and owns its own active styling (react-router `NavLink` render-prop, Inertia `Link`, …).
 */
type SectionLinkComponent = (props: {
    to: string;
    end?: boolean;
    children: ReactNode;
    /** ARIA label for the surrounding nav (the renderer sets it on the `<nav>`, not the link). */
    className?: string;
}) => ReactNode;

/** The window-chrome control surface the shell exposes to its contributed chrome (parity with host). */
interface WindowChrome {
    enterWindow: () => void;
    exitWindow: () => void;
    /** Is an editor previewing the tree an unentitled visitor gets? */
    viewAsVisitor: boolean;
    setViewAsVisitor: (v: boolean) => void;
}
/** The focus-chrome control surface — peer of {@link WindowChrome} for the focus mode. */
interface FocusChrome {
    enterFocus: () => void;
    exitFocus: () => void;
    /** Is focus mode currently active? (lets the entry affordance self-hide). */
    active: boolean;
}
interface UseShellModeOptions {
    /**
     * The raw store predicate — the tenant's real roles/permissions. The returned `effectiveCan`
     * wraps this: normally it IS `storeCan`; while a preview (view-as-visitor) is on it additionally
     * strips the previewed-out capability.
     */
    storeCan: MainframeCan;
    /**
     * The capability stripped while "view as visitor" is on (splicewire-app's `SITE_EDIT_CAP`). When
     * omitted, view-as-visitor is inert — the gate never strips anything (a host with no preview).
     */
    previewStripCapability?: Capability;
    /** Initial mode. Defaults to `desk`. */
    initialMode?: ShellMode;
}
interface ShellModeState {
    /** The current shell mode (host hands it to its `MainframeOutlet`). */
    mode: ShellMode;
    /** Set the mode directly (rarely needed — prefer the chrome control surfaces). */
    setMode: (mode: ShellMode) => void;
    /** The preview-aware entitlement predicate to feed the mainframe injection's `can`. */
    effectiveCan: MainframeCan;
    /** Is the view-as-visitor preview on? */
    viewAsVisitor: boolean;
    /** The window-mode control surface (enter/exit + preview toggle), identity-stable. */
    windowChrome: WindowChrome;
    /** The focus-mode control surface (enter/exit + active), identity-stable per `mode`. */
    focusChrome: FocusChrome;
}
/**
 * Derive an effective, preview-aware `can` from a base predicate. Extracted so a host can build the
 * gate imperatively (e.g. in a `useMemo`) without the full {@link useShellMode} hook. Pure.
 */
declare function createEffectiveCan(storeCan: MainframeCan, viewAsVisitor: boolean, previewStripCapability?: Capability): MainframeCan;
/**
 * The mode-switch + effectiveCan core. Returns the mode axis, a preview-aware `can`, and the two
 * chrome control surfaces (window / focus) — the exact seams splicewire-app's `AppShell` derived by
 * hand. Leaving `window` clears the preview so `desk` is never accidentally down-gated (parity).
 */
declare function useShellMode({ storeCan, previewStripCapability, initialMode, }: UseShellModeOptions): ShellModeState;

/** The default frame widths splicewire-app's section layouts used (all `<Outlet/>` containers). */
declare const SHELL_VARIANTS: {
    /** KnowledgeLayout / ComplianceLayout — a spaced full-width column. */
    readonly stack: "space-y-4";
    /** SettingsLayout — a centered, capped column. */
    readonly contained: "mx-auto max-w-5xl";
};
type SectionShellVariant = keyof typeof SHELL_VARIANTS;
interface SectionShellProps {
    /** The nested section content — the host wraps its router `<Outlet/>` here. */
    children: ReactNode;
    /** The frame width. Defaults to `stack`. */
    variant?: SectionShellVariant;
    /** Class override — replaces the variant's default entirely when set. */
    className?: string;
}
/**
 * The thin section shell — a content container the section's leaves nest under. The sub-tab strip
 * lives in the top-bar SectionBar (one nav grammar), so this owns ONLY the framing box.
 */
declare function SectionShell({ children, variant, className }: SectionShellProps): react.JSX.Element;
interface SectionTabStripProps {
    /** The (already host-filtered) tabs to render. */
    tabs: SectionTab[];
    /** The router link component (react-router `NavLink` wrapper / Inertia `Link`). Injected. */
    linkComponent: SectionLinkComponent;
    /** ARIA label for the `<nav>`. */
    ariaLabel: string;
    /**
     * `divided` renders the secondary (group / record) strip with the left divider; `primary` (the
     * default) renders the main section / meta-area strip.
     */
    variant?: 'primary' | 'divided';
    /** Class override for the `<nav>` (replaces the variant default). */
    className?: string;
    /** Whether the tab's active `end`-match is the compact (group/record) padding. Cosmetic parity. */
    compact?: boolean;
}
/**
 * One sub-tab strip: `<nav>{tabs.map(<Link/>)}</nav>`. The link owns its own active styling (the
 * host's `NavLink` render-prop), so this renders exactly the host's prior DOM — it just stops the
 * four copies of the loop from living in the host. Renders nothing for an empty tab set.
 */
declare function SectionTabStrip({ tabs, linkComponent: Link, ariaLabel, variant, className, }: SectionTabStripProps): react.JSX.Element | null;

/** The active second-level group for a pathname within a section, if any (longest match wins). */
declare function navGroupForPath(section: SectionMeta | undefined, pathname: string): SectionGroup | undefined;
/** The section a pathname currently belongs to, if any (longest match wins). */
declare function sectionMetaForPath(sections: SectionMeta[], pathname: string): SectionMeta | undefined;
/** The meta area (e.g. Settings) a pathname belongs to, if any — its tabs drive the folded strip. */
declare function metaAreaForPath(areas: MetaArea[], pathname: string): MetaArea | undefined;
/**
 * The breadcrumb chain for a meta-area path: `[{ root }, { current tab }]`, or `undefined` when the
 * path is not in a meta area. The current tab is resolved by the longest matching tab prefix, so
 * record sub-routes still root at their tab.
 */
declare function metaAreaCrumbs(areas: MetaArea[], pathname: string): MetaCrumb[] | undefined;

/**
 * FrameSidePanelOverlay — the single host-owned overlay surface. A host contributes it ONCE into its
 * mainframe `overlay` slot; it renders each live {@link useFrameSidePanelStore} publication through
 * the foundation `Sheet`. Renders nothing until a panel publishes — a no-cost resident of the slot.
 */
declare function FrameSidePanelOverlay(): react.JSX.Element;

interface DeskNavigation {
    mobile: boolean;
    open: boolean;
    onOpenChange(open: boolean): void;
}
declare function DeskMainframe({ slots, ctx, }: MainframeProps & {
    ctx: {
        navigation?: DeskNavigation;
    };
}): react.JSX.Element;

interface AppShellContext extends Omit<MainframeContext, 'mode' | 'payload'> {
    canvas?: 'flat' | 'dotted';
    navigation?: DeskNavigation;
}
interface AppShellProps {
    mode: 'desk' | 'window' | 'focus';
    can: MainframeCan;
    context: AppShellContext;
    /** Stable host composition. Feature transport and authorization remain with their owner. */
    contribute?(slots: SlotRegistry): void;
    /** Router outlet or page content, supplied by the host. */
    outlet: ReactNode;
    routeKey?: string;
    /** Preserve host-owned page chrome without an additional route wrapper. */
    unframed?: boolean;
}
/** Router-neutral placement core. Hosts own navigation, authorization, runtime facts and routes. */
declare function AppShell({ mode, can, context, contribute, outlet, routeKey, unframed, }: AppShellProps): react.JSX.Element;

interface AppRailItem {
    id: string;
    title: string;
    href: string;
    icon?: ReactNode;
}
interface AppRailGroup {
    id: string;
    label: string;
    items: readonly AppRailItem[];
}
interface AppRailProps {
    groups: readonly AppRailGroup[];
    /** Adapter translates href to its router's link contract, preserving aria-current/className. */
    Link?: ComponentType<ComponentProps<'a'>>;
    isActive?(href: string): boolean;
    label?: string;
    className?: string;
    /** Adapter owns row markup; core owns roster and active-state evaluation. */
    renderItem?(item: AppRailItem, state: {
        active: boolean;
    }): ReactNode;
    /** Preserve host group/list primitives without a second navigation loop. */
    renderGroup?(group: AppRailGroup, items: ReactNode): ReactNode;
}
/** Render only the host's admitted navigation roster; no routes or authorization are inferred. */
declare function AppRail({ groups, Link, isActive, label, className, renderItem, renderGroup }: AppRailProps): react.JSX.Element;

interface BeamAppOptions<Runtime> {
    /** Host-defined facts, kept separate from routing and feature transport. */
    runtime: Runtime;
    Providers?: ComponentType<{
        children: ReactNode;
    }>;
}
/**
 * Compose a shell with an isolated, typed runtime context. The host creates its router,
 * injects its outlet, and owns mounting/unmounting; importing this entry has no browser effects.
 */
declare function createBeamApp<Runtime>({ runtime, Providers }: BeamAppOptions<Runtime>): {
    runtime: Runtime;
    App: (props: AppShellProps) => react.JSX.Element;
    Provider: ({ children }: {
        children: ReactNode;
    }) => react.JSX.Element;
    useRuntime: () => Runtime;
};

declare function WindowMainframe({ slots, ctx }: MainframeProps): react.JSX.Element;

declare function FocusMainframe({ slots, ctx }: MainframeProps): react.JSX.Element;

export { AppRail, type AppRailGroup, type AppRailItem, type AppRailProps, AppShell, type AppShellContext, type AppShellProps, type BeamAppOptions, type Capability, DeskMainframe, type DeskNavigation, type FocusChrome, FocusMainframe, FrameSidePanelOverlay, type MetaArea, type MetaCrumb, type SectionGroup, type SectionLinkComponent, type SectionMeta, SectionShell, type SectionShellProps, type SectionShellVariant, type SectionTab, SectionTabStrip, type SectionTabStripProps, type ShellMode, type ShellModeState, type UseShellModeOptions, type WindowChrome, WindowMainframe, createBeamApp, createEffectiveCan, metaAreaCrumbs, metaAreaForPath, navGroupForPath, sectionMetaForPath, useShellMode };
