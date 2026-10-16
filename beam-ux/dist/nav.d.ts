import * as react from 'react';
import { ComponentType, ReactNode } from 'react';

/**
 * `@splicewire/beam-ux/nav` — the shared shapes for the realm-aware grouped rail nav.
 *
 * Structural, framework-neutral, and theme-neutral by design, mirroring the `/site` + `/account`
 * subpaths (tickets 10 / 13). The `items` a host feeds `<RealmNav>` are the top-level nodes of the
 * `nav` tree the PHP `ResolveNav` projects into a realm's frame manifest (a `laravel-data-nav`
 * `NavNode[]`) — entitlement-filtered and active-STAMPED server-side. The type is a SUPERSET shape so
 * the host's generated `NavNode` structurally satisfies it without the package depending on the
 * host's generated types. Links render through an injected {@link LinkComponent} and icons through an
 * injected renderer — the package imports no router and ships no icon set.
 */

/**
 * One projected nav node — the `laravel-data-nav` `NavNode` serialized to JSON. A superset shape
 * (extra keys allowed) so a host's `NavNode` fits it. `icon` is a *name string* (the host maps it to
 * its own icon component); `active`/`activeTrail` are STAMPED server-side by `ResolveNav`, so the
 * renderer reads highlight from the node, never re-deriving it. `kind` is the discriminator — the
 * renderer keeps a default arm for unknown host kinds (§7 "tolerate unknown"). `locked` is the
 * wire-visible soft-lock projection (Frame OS ticket 11), produced by
 * `Splicewire\Beam\Ux\Frame\NavSectionProjector` for a seat whose entitlement gate declares a
 * `NavSeatLock`, and RENDERED by `<RealmNav>` as a non-navigating row that opens an upsell popover.
 */
type RealmNavNode = {
    kind?: string;
    title: string;
    href?: string | null;
    match?: string | null;
    icon?: string | null;
    routeName?: string | null;
    active?: boolean;
    activeTrail?: boolean;
    children?: RealmNavNode[];
    /** The soft-lock projection ({ reason, upsell }); present-but-locked when non-null (ticket 11). */
    locked?: {
        reason: string;
        upsell?: string | null;
    } | null;
    /**
     * The zone a top-level node is drawn in (ux-walkthrough M4): `primary` is the rail, `meta` the Developer zone, whose
     * children are developer SEATS. Absent on trees a projector did not partition.
     */
    zone?: 'primary' | 'meta' | null;
};
/**
 * A link renderer. Defaults to a plain `<a>`; a host injects its router's component (e.g. Inertia's
 * `Link` or react-router's `NavLink` wrapper) for client-side navigation + active detection. Kept to
 * the intersection of the props both speak. `data-active` lets the host style the active row from the
 * server-stamped flag the component forwards.
 */
type LinkComponent = ComponentType<{
    href: string;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
    'data-active'?: boolean;
    'aria-current'?: 'page' | undefined;
}>;
/**
 * How the flat, server-resolved tree folds into groups. Both variants render grouping from the
 * **hrefless-parent-is-a-group-header** convention (no `group` field) and preserve the authored
 * child order (`nav_order`, already reflected in the tree) — they differ only in WHERE the group
 * label comes from:
 *
 *  - `section-groups` — each top-level node becomes a labeled group of its own `children` (a childless
 *    node falls back to itself as a lone item). For a realm whose rail owns the whole IA with no
 *    top-bar section strip (splicewire's operator `/admin` realm).
 *  - `flat-with-headers` — top-level nodes render as items; a node with no `href` OPENS a new labeled
 *    group (the §7 convention). For a realm whose sections live in a top bar and the rail is flat
 *    (splicewire's tenant realm).
 */
type RealmNavVariant = 'section-groups' | 'flat-with-headers';
/** Class overrides for the rendered chrome — every one optional, each defaulting to the packaged look. */
type RealmNavClassNames = {
    /** The `<nav>` wrapper. */
    root?: string;
    /** Each group's wrapper `<div>`. */
    group?: string;
    /** A group's uppercase label. */
    groupLabel?: string;
    /** The Developer zone's wrapper (`[data-zone="meta"]`), set apart from the rail above it. */
    zone?: string;
    /** The Developer zone's own title, styled apart from the section labels inside it. */
    zoneLabel?: string;
    /** A nav item link — a string, or a fn of the server-stamped active flag (for active styling). */
    item?: string | ((active: boolean) => string);
    /** A nav item's leading icon slot. */
    itemIcon?: string | ((active: boolean) => string);
    /** A nav item's title span. */
    itemLabel?: string;
};
/**
 * One realm a principal may cross to, as the host's `HostRealmsData` (laravel-beam `src/Ia`) serves it. `surface` is
 * `site` for the public site and `app` for every signed-in realm; `locked` marks one the principal sees but may not
 * enter yet.
 */
type HostRealm = {
    key: string;
    label: string;
    href: string;
    surface: 'site' | 'app' | (string & {});
    locked: boolean;
    upsell?: unknown;
    /** The realm whose manifest this realm reads (app-walkthrough APP-14, M2′); absent from a host on an older payload. */
    manifest?: string;
    /** Whether that realm resolves a tenant: the shell shows tenant chrome only where it does (APP-5). */
    tenantScoped?: boolean;
};
/** The host IA payload: the realms, the one this request is in, and where "Back" goes (ux-walkthrough M2′). */
type HostRealms = {
    realms: HostRealm[];
    current: string | null;
    back: {
        label: string;
        href: string;
    } | null;
    plays?: string[];
};

/**
 * The CSS `<RealmNav>` injects, as a **string** — see `src/css.ts` for the contract (render-time
 * `<style>`, never an import-time injection; tokens with plain fallbacks; no hex).
 *
 * Three of the rail's utilities lived only inside this package's dist and rendered only at a host
 * whose Tailwind scanned it (beam-docs-satellite 62). `tracking-[0.1em]` was the sharpest: it sat in
 * the same literal as `text-sidebar-foreground/55`, which every host emits, so the group label rendered
 * in the right colour at the wrong letter-spacing — half a class list, harder to notice than none.
 */
/**
 * The active item's text colour, as a token with a plain fallback.
 *
 * `sidebar-active-foreground` is **not** one of shadcn's eight standard sidebar tokens — it was invented
 * by splicewire-app, the only host that defines it. Read raw, with the standard `--sidebar-foreground`
 * as the fallback, so any other host adopting the rail gets a colour rather than nothing.
 *
 * The chain names the RAW `--sidebar-*` properties, not the `--color-*` theme keys: splicewire-app
 * declares its palette in `@theme inline`, which resolves `--color-*` at BUILD time and emits none of
 * them as runtime custom properties, so a `--color-` chain would be undefined at the one host that
 * matters. The un-prefixed properties are real `:root` declarations in both the flagship
 * (`ui/src/index.css`) and a stock starter (`resources/css/app.css`).
 */
declare const SIDEBAR_ACTIVE_FG = "var(--sidebar-active-foreground,var(--sidebar-foreground))";
/**
 * The locked row + its upsell popover carry `beam-nav-`-prefixed class names rather than the
 * `upsell-*` / `launcher-scrim` names `@schemastud/mainframe/os` uses for the locked DESKTOP TILE.
 *
 * The two surfaces match in BEHAVIOUR on purpose — a locked row opens the upsell and never
 * navigates, exactly as a locked dock tile opens the upsell and never opens a window — and they must
 * not match in SELECTORS. The desktop chrome deliberately ships no CSS and leaves `.upsell-pop` for
 * the host to style; this package ships its rules inline. Reusing those names would mean this
 * package's sheet silently restyling the host's dock popover wherever both are rendered, which is the
 * class of defect the whole render-time-`<style>` contract exists to avoid.
 */
declare const REALM_NAV_CSS = "\n.beam-nav-label { letter-spacing: 0.1em; }\n.beam-nav-icon { width: 17px; height: 17px; }\n.beam-nav-item[data-active='true'] { color: var(--sidebar-active-foreground,var(--sidebar-foreground)); }\n.beam-nav-item[data-active='false']:hover { color: var(--sidebar-active-foreground,var(--sidebar-foreground)); }\n.beam-nav-item[data-locked='true'] {\n  width: 100%;\n  cursor: pointer;\n  font: inherit;\n  text-align: left;\n  background: none;\n  opacity: var(--beam-nav-locked-opacity, 0.65);\n}\n.beam-nav-item[data-locked='true']:hover { opacity: 1; }\n.beam-nav-lock { flex: none; margin-left: auto; font-size: 0.85em; line-height: 1; }\n.beam-nav-upsell-scrim { position: fixed; inset: 0; z-index: 50; }\n.beam-nav-upsell {\n  position: fixed;\n  z-index: 51;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  width: min(var(--beam-nav-upsell-width, 22rem), calc(100vw - 2rem));\n  padding: 1.25rem;\n  border-radius: 0.75rem;\n  background: var(--card, var(--background));\n  color: var(--card-foreground, var(--foreground));\n  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);\n}\n.beam-nav-upsell-title { font-weight: 600; margin-bottom: 0.375rem; }\n.beam-nav-upsell-copy { margin: 0 0 1rem; opacity: 0.8; }\n";

type RealmNavProps = {
    /**
     * The top-level nodes of the realm's resolved `nav` tree (a `laravel-data-nav` `NavNode[]`,
     * entitlement-filtered + active-stamped server-side). The host reads this off its frame manifest.
     */
    items?: RealmNavNode[] | null;
    /** How the flat tree folds into groups (see {@link RealmNavVariant}). Defaults to `flat-with-headers`. */
    variant?: RealmNavVariant;
    /** Router link component (e.g. react-router `NavLink` wrapper / Inertia `Link`). Defaults to `<a>`. */
    linkComponent?: LinkComponent;
    /**
     * Leading-icon renderer — maps a node to its rendered icon. Receives the resolved icon class and
     * the server-stamped active flag so the host applies them DIRECTLY to its icon component (no
     * wrapper element), preserving the host's exact DOM. Absent ⇒ no icon.
     */
    icon?: (node: RealmNavNode, ctx: {
        className: string;
        active: boolean;
    }) => ReactNode;
    /** Class overrides; each defaults to the packaged look. */
    classNames?: RealmNavClassNames;
    /**
     * The upsell CTA rendered inside a locked row's popover. Receives the node and its OPAQUE
     * `upsell` token — a plan key, an upgrade href, a feature id; neither PHP nor this component
     * interprets it, so mapping it to an actual upgrade destination is the host's job and this is the
     * seam for it. Absent ⇒ a plain "Upgrade" button that closes the popover, which surfaces the lock
     * without pretending to know where the host sells.
     */
    upsellCta?: (node: RealmNavNode, ctx: {
        upsell: string | null;
    }) => ReactNode;
    /**
     * The Developer zone's slot (ux-walkthrough M7). Receives the tree's `zone: meta` nodes, which never sit in the rail,
     * and renders them where this host keeps its meta zone (the flagship's System zone, a starter's rail footer). Absent
     * ⇒ RealmNav draws them after the rail, each developer seat a labeled group of its rows.
     */
    meta?: (nodes: RealmNavNode[]) => ReactNode;
};

declare function RealmNav({ items, variant, linkComponent, icon, classNames, upsellCta, meta, }: RealmNavProps): react.JSX.Element;

type RealmSwitcherProps = {
    /** The host IA payload (`HostRealmsData`). */
    realms: HostRealms;
    /** The trigger's text: the signed-in principal's name. */
    label: ReactNode;
    /** Where "Sign out" goes: a full-page GET that confirms and POSTs (ux-walkthrough IA-5). */
    signOutHref: string;
    /** The host's router link (Inertia `Link`, react-router `NavLink`); defaults to a plain `<a>`. */
    linkComponent?: LinkComponent;
    /** Workspaces the principal belongs to, drawn above the realms (the host's own picker). */
    workspaces?: ReactNode;
    /** Open on first render (stories, tests). */
    defaultOpen?: boolean;
    /** The realm the shell is in (useCurrentRealm's), which wins over the payload's `current` (app-walkthrough APP-14). */
    current?: string | null;
    /** Where the menu opens: below the trigger (a header), or above it (a trigger at the bottom of a rail). */
    side?: 'bottom' | 'top';
    className?: string;
    /**
     * Classes for the trigger BUTTON itself. The trigger is router-free and shape-agnostic, so each shell
     * styles it for its slot: the sidebar-foot user chip wants a full-width flex row (so a multi-element
     * `label` — avatar + name — lays out in a row rather than stacking) plus its menu-button chrome; a
     * header trigger wants nothing. Left unset, the button carries no class (unchanged for text-label
     * consumers like the site header).
     */
    triggerClassName?: string;
};
/**
 * The ONE crossing point between realms (ux-walkthrough IA-3, M7): the user menu. It lists the app realms the payload
 * offers (the server already drops the ones the principal may not see, and a `locked` one is left out), then
 * "View site" when a site realm exists, then "Sign out". Closed, it renders no realm link at all, so "Operator"
 * appears only once it is opened. Router-free: each shell injects its link component.
 */
declare function RealmSwitcher({ realms, label, signOutHref, linkComponent, workspaces, defaultOpen, side, current, className, triggerClassName, }: RealmSwitcherProps): react.JSX.Element;

/**
 * You are here (ux-walkthrough IA-4, M7): which realm `pathname` is in, and where "← Back to {workspace}" goes. The
 * realm is the one whose home is the LONGEST prefix of the path, because an SPA navigates without refetching the
 * payload. It falls back to the server's `current`, then to the default workspace. `back` exists only outside the default workspace, and prefers the
 * server's own `back`. This replaces each shell's `startsWith('/operator')` checks.
 */
declare function useCurrentRealm(data: HostRealms | null | undefined, pathname: string): {
    readonly realm: HostRealm | null;
    readonly back: {
        label: string;
        href: string;
    } | null;
};

/**
 * You are here (ux-walkthrough IA-4, M7): at the top of the rail in any realm other than the default workspace, the
 * realm's label and "← Back to {workspace}". Feed it {@link useCurrentRealm}'s result. In the default workspace
 * (`back` null) it renders nothing.
 */
declare function RealmHeader({ realm, back, linkComponent, className, }: {
    realm: HostRealm | null;
    back: {
        label: string;
        href: string;
    } | null;
    linkComponent?: LinkComponent;
    className?: string;
}): react.JSX.Element | null;

export { type HostRealm, type HostRealms, type LinkComponent, REALM_NAV_CSS, RealmHeader, RealmNav, type RealmNavClassNames, type RealmNavNode, type RealmNavProps, type RealmNavVariant, RealmSwitcher, type RealmSwitcherProps, SIDEBAR_ACTIVE_FG, useCurrentRealm };
