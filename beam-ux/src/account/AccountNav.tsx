// @splicewire/beam-ux/account — the data-driven account nav group. Renders the projected `account`
// sitemap items as a labelled group of sidebar menu rows (`@schemastud/ui` Sidebar parts).
//
// Framework-neutral: the caller PASSES the nav (no `usePage`) and MAY inject a `linkComponent` (its
// router's `<Link>`) — absent one, links fall back to a plain `<a>`. Active state is delegated to an
// optional `isActive(href)` predicate (the host owns URL-matching), and each row's leading icon is
// supplied by an optional `itemIcon` renderer (the projected nav carries no icon).
import type { ReactNode } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@schemastud/ui';
import type { AccountNavData, AccountNavItem, LinkComponent } from './types.js';

export type AccountNavProps = {
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

export function AccountNav({ nav, label = 'Account', linkComponent, isActive, itemIcon }: AccountNavProps) {
    const items = (nav?.items ?? []).filter((item): item is AccountNavItem & { href: string } => !!item.href);
    const Link: LinkComponent = linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);

    if (items.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive?.(item.href) ?? false}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {itemIcon?.(item)}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
