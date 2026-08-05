// @splicewire/beam-ux/account — the generic authed account shell (beam-ux-uplift ticket 13).
//
// The AppLayout + sidebar chrome for a beam host's account area: a `@schemastud/ui` Sidebar (brand
// header + a data-driven nav group + an optional plan/profile/account/upsell block + a user footer
// slot) beside the page `main`, wrapped in the SidebarProvider. So a fresh host gets the account
// area OOTB and collapses its own `app-sidebar.tsx` onto this.
//
// Framework-neutral & theme-neutral by contract, mirroring `/site` (ticket 10):
//   - the caller PASSES `nav` (the projected `account` sitemap) + `shell` (the `AccountShellData`
//     projection, ticket 08) — no `usePage`; the package imports no router (inject `linkComponent`);
//   - all COPY comes from the data/props (`shell.plan.label`, `upsells[].label`, …), never baked in;
//   - the plan / profile / account / upsell sidebar sections are OPT-IN (`sections`) so a host that
//     renders them in its page body (as audiostud does) keeps a lean nav-only sidebar;
//   - look arrives via className/style theme hooks + the host `--sidebar*` tokens — the package
//     ships no palette, fonts, or wordmark (brand is a slot).
import type { CSSProperties, ReactNode } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    TooltipProvider,
} from '@schemastud/ui';
import { AccountNav, type AccountNavProps } from './AccountNav.js';
import type { AccountNavItem, AccountShellData, LinkComponent } from './types.js';

/** Which OPT-IN sidebar sections to render below the nav (all default off — nav-only sidebar). */
export type AccountShellSections = {
    plan?: boolean;
    profile?: boolean;
    account?: boolean;
    upsells?: boolean;
};

export type AccountShellProps = {
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
    sectionLabels?: { plan?: string; profile?: string; account?: string; upsells?: string };

    /** Sidebar shape passthroughs (defaults mirror a typical app shell). */
    collapsible?: 'offcanvas' | 'icon' | 'none';
    variant?: 'sidebar' | 'floating' | 'inset';
    /** Initial open state handed to the provider (host reads its persisted cookie). */
    defaultOpen?: boolean;

    // Theme hooks — the shell wrapper, inset, and each opt-in section take class + style.
    className?: string;
    style?: CSSProperties;
    insetClassName?: string;
    insetStyle?: CSSProperties;
    sectionClassName?: string;
    sectionStyle?: CSSProperties;
};

export function AccountShell({
    children,
    nav,
    shell,
    linkComponent,
    brand,
    brandHref,
    navLabel = 'Account',
    isActive,
    navItemIcon,
    action,
    user,
    sections,
    sectionLabels,
    collapsible = 'icon',
    variant = 'inset',
    defaultOpen = true,
    className,
    style,
    insetClassName,
    insetStyle,
    sectionClassName,
    sectionStyle,
}: AccountShellProps) {
    const Link: LinkComponent = linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);

    const brandHeader =
        brand == null ? null : brandHref ? (
            <Link href={brandHref} prefetch>
                {brand}
            </Link>
        ) : (
            brand
        );

    return (
        <SidebarProvider defaultOpen={defaultOpen} className={className} style={style}>
            {/* Self-sufficient tooltips: the Sidebar menu rows use the collapsed-rail Tooltip, which
                needs a TooltipProvider ancestor — the shell supplies its own so a host need not
                remember to. (A host-level provider higher up nests harmlessly.) */}
            <TooltipProvider delayDuration={0}>
                <Sidebar collapsible={collapsible} variant={variant}>
                {brandHeader != null && (
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild>
                                    {brandHeader}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                )}

                <SidebarContent>
                    {action != null && (
                        <SidebarGroup className="px-2 py-0 group-data-[collapsible=icon]:hidden">
                            {action}
                        </SidebarGroup>
                    )}

                    <AccountNav
                        nav={nav}
                        label={navLabel}
                        linkComponent={linkComponent}
                        isActive={isActive}
                        itemIcon={navItemIcon}
                    />

                    {sections?.plan && shell?.plan && (
                        <SidebarGroup className={sectionClassName} style={sectionStyle}>
                            <SidebarGroupLabel>{sectionLabels?.plan ?? 'Plan'}</SidebarGroupLabel>
                            <PlanMeter shell={shell} />
                        </SidebarGroup>
                    )}

                    {sections?.profile && shell?.profile && (
                        <SidebarGroup className={sectionClassName} style={sectionStyle}>
                            <SidebarGroupLabel>{sectionLabels?.profile ?? 'Profile'}</SidebarGroupLabel>
                            <ProfileBlock shell={shell} />
                        </SidebarGroup>
                    )}

                    {sections?.upsells && shell?.upsells && shell.upsells.length > 0 && (
                        <SidebarGroup className={sectionClassName} style={sectionStyle}>
                            <SidebarGroupLabel>{sectionLabels?.upsells ?? 'Upgrade'}</SidebarGroupLabel>
                            <SidebarMenu>
                                {shell.upsells.map((upsell) => (
                                    <SidebarMenuItem key={upsell.key}>
                                        <SidebarMenuButton asChild tooltip={{ children: upsell.label }}>
                                            <Link href={upsell.href ?? '#'} prefetch>
                                                <span>{upsell.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    )}

                    {sections?.account && shell?.account && (
                        <SidebarGroup className={sectionClassName} style={sectionStyle}>
                            <SidebarGroupLabel>{sectionLabels?.account ?? 'Account'}</SidebarGroupLabel>
                            <AccountBlock shell={shell} />
                        </SidebarGroup>
                    )}
                </SidebarContent>

                {user != null && <SidebarFooter>{user}</SidebarFooter>}
                </Sidebar>

                <SidebarInset className={insetClassName} style={insetStyle}>
                    {children}
                </SidebarInset>
            </TooltipProvider>
        </SidebarProvider>
    );
}

function PlanMeter({ shell }: { shell: AccountShellData }) {
    const { label, credits, max } = shell.plan;
    const hasGauge = typeof credits === 'number' && typeof max === 'number';

    return (
        <div data-account-section="plan" className="px-2 py-1.5 text-xs">
            <div className="font-medium">{label}</div>
            {hasGauge && (
                <div className="text-muted-foreground mt-1 tabular-nums">
                    {credits} / {max}
                </div>
            )}
        </div>
    );
}

function ProfileBlock({ shell }: { shell: AccountShellData }) {
    const { handle, metrics } = shell.profile;

    return (
        <div data-account-section="profile" className="px-2 py-1.5 text-xs">
            <div className="font-medium">{handle}</div>
            {metrics.length > 0 && (
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {metrics.map((metric) => (
                        <span key={metric.label}>
                            <span className="font-medium">{metric.value}</span> {metric.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function AccountBlock({ shell }: { shell: AccountShellData }) {
    const { email, paymentMethodLabel } = shell.account;

    return (
        <div data-account-section="account" className="px-2 py-1.5 text-xs">
            <div className="truncate">{email}</div>
            <div className="text-muted-foreground mt-0.5">{paymentMethodLabel ?? 'None on file'}</div>
        </div>
    );
}
