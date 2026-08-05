/**
 * `@splicewire/beam-ux/account` — the shared shapes for the authed account chrome.
 *
 * Structural, framework-neutral, and theme-neutral by design, mirroring the `/site` subpath
 * (ticket 10). The `nav` a host feeds `<AccountShell>` is the `account` sitemap projected by the
 * PHP `NavProjector`; the `shell` is the `AccountShellData` projection shipped by the PHP
 * `laravel-beam-accounts` provider (ticket 08). Both are matched by SHAPE — the package never
 * depends on the host's generated types (a host's `NavNode` / `AccountShellData` structurally fits
 * these supersets). Links render through an injected {@link LinkComponent}; the package imports no
 * router.
 */

import type { ComponentType, ReactNode } from 'react';

/** One projected account-nav node. Superset shape (extra keys allowed) so the host's node fits it. */
export type AccountNavItem = {
    title: string;
    href?: string | null;
    /** Nested nodes, if the projection carries a tree. Unused by the flat account nav. */
    children?: AccountNavItem[];
};

/** The projected `account` sitemap. Matches `Rushing.DataNav.NavTree` — `{ items }`. */
export type AccountNavData = {
    items: AccountNavItem[];
};

/** The plan meter — tier + label, and (optional) a used/max render-credit gauge. */
export type AccountShellPlan = {
    tier: string;
    label: string;
    credits?: number | null;
    max?: number | null;
};

/** One profile stat (e.g. `{ label: 'SONGS', value: '4' }`). */
export type AccountProfileMetric = {
    label: string;
    value: string;
};

/** The public-profile block — handle, an optional avatar token, and the social metric row. */
export type AccountShellProfile = {
    handle: string;
    avatar?: string | null;
    metrics: AccountProfileMetric[];
};

/** The account block — the signed-in email and an optional payment-method label. */
export type AccountShellAccount = {
    email: string;
    paymentMethodLabel?: string | null;
};

/** One upsell CTA (e.g. per-song purchase, subscription upgrade). Copy comes from `label`. */
export type AccountShellUpsell = {
    key: string;
    label: string;
    href?: string | null;
};

/**
 * The `AccountShellData` projection (ticket 08). A superset shape so the host's generated
 * `AccountShellData` structurally satisfies it without the package importing the host's types.
 */
export type AccountShellData = {
    plan: AccountShellPlan;
    profile: AccountShellProfile;
    account: AccountShellAccount;
    upsells: AccountShellUpsell[];
};

/**
 * A link renderer. Defaults to a plain `<a>`; a host injects its router's component (e.g. Inertia's
 * `Link`) for client-side navigation. Kept to the intersection of the props both speak, plus the
 * common passthroughs the shell hands links (`prefetch`, `title`).
 */
export type LinkComponent = ComponentType<{
    href: string;
    className?: string;
    style?: React.CSSProperties;
    prefetch?: boolean;
    title?: string;
    children?: ReactNode;
}>;
