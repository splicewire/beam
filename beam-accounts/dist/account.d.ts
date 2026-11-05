import * as react from 'react';
import { ComponentType, ReactNode, CSSProperties } from 'react';

/**
 * `@splicewire/beam-accounts/account` — the shared shapes for the authed account chrome.
 *
 * Structural, framework-neutral, and theme-neutral by design, mirroring the `/site` subpath
 * (ticket 10). The `nav` a host feeds `<AccountShell>` is the `account` sitemap projected by the
 * PHP `NavProjector`; the `shell` is the `AccountShellData` projection shipped by the PHP
 * `laravel-beam-accounts` provider (ticket 08). Both are matched by SHAPE — the package never
 * depends on the host's generated types (a host's `NavNode` / `AccountShellData` structurally fits
 * these supersets). Links render through an injected {@link LinkComponent}; the package imports no
 * router.
 */

/** One projected account-nav node. Superset shape (extra keys allowed) so the host's node fits it. */
type AccountNavItem = {
    title: string;
    href?: string | null;
    /** Nested nodes, if the projection carries a tree. Unused by the flat account nav. */
    children?: AccountNavItem[];
};
/** The projected `account` sitemap. Matches `Rushing.DataNav.NavTree` — `{ items }`. */
type AccountNavData = {
    items: AccountNavItem[];
};
/** The plan meter — tier + label, and (optional) a used/max render-credit gauge. */
type AccountShellPlan = {
    tier: string;
    label: string;
    credits?: number | null;
    max?: number | null;
};
/** One profile stat (e.g. `{ label: 'SONGS', value: '4' }`). */
type AccountProfileMetric = {
    label: string;
    value: string;
};
/** The public-profile block — handle, an optional avatar token, and the social metric row. */
type AccountShellProfile = {
    handle: string;
    avatar?: string | null;
    metrics: AccountProfileMetric[];
};
/** The account block — the signed-in email and an optional payment-method label. */
type AccountShellAccount = {
    email: string;
    paymentMethodLabel?: string | null;
};
/** One upsell CTA (e.g. per-song purchase, subscription upgrade). Copy comes from `label`. */
type AccountShellUpsell = {
    key: string;
    label: string;
    href?: string | null;
};
/**
 * The `AccountShellData` projection (ticket 08). A superset shape so the host's generated
 * `AccountShellData` structurally satisfies it without the package importing the host's types.
 */
type AccountShellData = {
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
type LinkComponent = ComponentType<{
    href: string;
    className?: string;
    style?: React.CSSProperties;
    prefetch?: boolean;
    title?: string;
    children?: ReactNode;
}>;

type AccountNavProps = {
    /** The projected `account` sitemap. Its top-level `items` render as the nav rows. */
    nav?: AccountNavData | null;
    /** Group label above the rows (e.g. `Account`). */
    label?: string;
    /** Router link component (e.g. Inertia `Link`). Defaults to a plain `<a>`. */
    linkComponent?: LinkComponent;
    /** Predicate for the active row (the host owns URL matching). */
    isActive?: (href: string) => boolean;
    /** Leading-icon renderer for a row (the projection carries no icon). */
    itemIcon?: (item: AccountNavItem) => ReactNode;
};
declare function AccountNav({ nav, label, linkComponent, isActive, itemIcon }: AccountNavProps): react.JSX.Element | null;

/** Which OPT-IN sidebar sections to render below the nav (all default off — nav-only sidebar). */
type AccountShellSections = {
    plan?: boolean;
    profile?: boolean;
    account?: boolean;
    upsells?: boolean;
};
type AccountShellProps = {
    /** Page content — the single required slot, rendered in the sidebar inset. */
    children: ReactNode;
    /** The projected `account` sitemap fed to the nav group. */
    nav?: AccountNavProps['nav'];
    /** The `AccountShellData` projection (ticket 08) driving the opt-in plan/profile/account/upsell sections. */
    shell?: AccountShellData | null;
    /** Router link component (e.g. Inertia `Link`). Defaults to a plain `<a>` throughout. */
    linkComponent?: LinkComponent;
    /** Brand mark in the sidebar header (host wordmark/logo). Linked to `brandHref` when set. */
    brand?: ReactNode;
    /** Where the brand links (e.g. `/account`). Omit to render the brand un-linked. */
    brandHref?: string;
    /** Nav group label (e.g. `Account`). */
    navLabel?: string;
    /** Active-row predicate for the nav (host owns URL matching). */
    isActive?: AccountNavProps['isActive'];
    /** Leading-icon renderer for a nav row (the projection carries no icon). */
    navItemIcon?: (item: AccountNavItem) => ReactNode;
    /** A slot rendered between the header and the nav (e.g. a "New song" primary action). */
    action?: ReactNode;
    /** The sidebar footer slot — typically the host's user/account dropdown affordance. */
    user?: ReactNode;
    /** Which opt-in sections to render below the nav (all off by default). */
    sections?: AccountShellSections;
    /** Section group labels (host copy) — used only when the matching section is enabled. */
    sectionLabels?: {
        plan?: string;
        profile?: string;
        account?: string;
        upsells?: string;
    };
    /** Sidebar shape passthroughs (defaults mirror a typical app shell). */
    collapsible?: 'offcanvas' | 'icon' | 'none';
    variant?: 'sidebar' | 'floating' | 'inset';
    /** Initial open state handed to the provider (host reads its persisted cookie). */
    defaultOpen?: boolean;
    /**
     * Below the Sidebar's mobile breakpoint the rail is an off-canvas drawer; the shell renders a bar
     * atop the page with the trigger that opens it, plus the brand (or the nav label). On by default:
     * without it a narrow screen has no way to reach the account nav. Pass `false` only when the host
     * renders its own `SidebarTrigger` inside the page.
     */
    mobileBar?: boolean;
    /** Accessible name of the mobile bar's drawer trigger (host copy). */
    menuLabel?: string;
    className?: string;
    style?: CSSProperties;
    insetClassName?: string;
    insetStyle?: CSSProperties;
    sectionClassName?: string;
    sectionStyle?: CSSProperties;
};
declare function AccountShell({ children, nav, shell, linkComponent, brand, brandHref, navLabel, isActive, navItemIcon, action, user, sections, sectionLabels, collapsible, variant, defaultOpen, mobileBar, menuLabel, className, style, insetClassName, insetStyle, sectionClassName, sectionStyle, }: AccountShellProps): react.JSX.Element;

/**
 * The CSS `<AccountShell>` injects, as a **string** — see `src/css.ts` for the contract (render-time
 * `<style>`, never an import-time injection; tokens with plain fallbacks; no hex).
 *
 * Two of the shell's utilities lived only inside this package's dist (beam-docs-satellite 62):
 * `group-data-[collapsible=icon]:hidden` on the action slot, and `gap-y-0.5` on the profile metrics.
 * The first reads the `data-collapsible` attribute the `@schemastud/ui` Sidebar stamps on its root
 * when the rail collapses to icons.
 *
 * Below the Sidebar's 768px mobile breakpoint the rail becomes an off-canvas drawer that only a
 * `SidebarTrigger` opens, so the shell renders a mobile bar carrying one (beam VR pass 2: at 320px the
 * account nav was unreachable). The bar hides at the breakpoint the Sidebar's `useIsMobile` uses.
 *
 * Secondary lines in the sidebar blocks read the SIDEBAR ink, not `--muted-foreground`: the rail keeps
 * its own dark tone in a light page, where page-muted ink ("None on file") was dark on dark.
 */
declare const ACCOUNT_SHELL_CSS = "\n[data-collapsible='icon'] .beam-ux-account-action { display: none; }\n.beam-ux-account-metrics { row-gap: 0.125rem; }\n.beam-ux-account-secondary { color: var(--sidebar-foreground, currentColor); opacity: 0.8; }\n.beam-ux-account-mobilebar {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  min-height: 3rem;\n  padding: 0.5rem 0.75rem;\n  border-bottom: 1px solid var(--border, currentColor);\n  font-weight: 600;\n}\n.beam-ux-account-mobilebar > a { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }\n@media (min-width: 768px) { .beam-ux-account-mobilebar { display: none; } }\n";

export { ACCOUNT_SHELL_CSS, AccountNav, type AccountNavData, type AccountNavItem, type AccountNavProps, type AccountProfileMetric, AccountShell, type AccountShellAccount, type AccountShellData, type AccountShellPlan, type AccountShellProfile, type AccountShellProps, type AccountShellSections, type AccountShellUpsell, type LinkComponent };
