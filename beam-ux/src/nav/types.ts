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

import type { ComponentType, ReactNode } from 'react';

/**
 * One projected nav node — the `laravel-data-nav` `NavNode` serialized to JSON. A superset shape
 * (extra keys allowed) so a host's `NavNode` fits it. `icon` is a *name string* (the host maps it to
 * its own icon component); `active`/`activeTrail` are STAMPED server-side by `ResolveNav`, so the
 * renderer reads highlight from the node, never re-deriving it. `kind` is the discriminator — the
 * renderer keeps a default arm for unknown host kinds (§7 "tolerate unknown"). `locked` is the
 * wire-visible soft-lock projection (Frame OS ticket 11); tolerated here, rendered by ticket 13.
 */
export type RealmNavNode = {
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
    locked?: { reason: string; upsell?: string | null } | null;
};

/**
 * A link renderer. Defaults to a plain `<a>`; a host injects its router's component (e.g. Inertia's
 * `Link` or react-router's `NavLink` wrapper) for client-side navigation + active detection. Kept to
 * the intersection of the props both speak. `data-active` lets the host style the active row from the
 * server-stamped flag the component forwards.
 */
export type LinkComponent = ComponentType<{
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
export type RealmNavVariant = 'section-groups' | 'flat-with-headers';

/** Class overrides for the rendered chrome — every one optional, each defaulting to the packaged look. */
export type RealmNavClassNames = {
    /** The `<nav>` wrapper. */
    root?: string;
    /** Each group's wrapper `<div>`. */
    group?: string;
    /** A group's uppercase label. */
    groupLabel?: string;
    /** A nav item link — a string, or a fn of the server-stamped active flag (for active styling). */
    item?: string | ((active: boolean) => string);
    /** A nav item's leading icon slot. */
    itemIcon?: string | ((active: boolean) => string);
    /** A nav item's title span. */
    itemLabel?: string;
};
