import { Link, usePage } from '@inertiajs/react';
import { RealmHeader, RealmNav, useCurrentRealm, type HostRealms, type RealmNavNode } from '@splicewire/beam-ux/nav';
import AppLogo from './app-logo';
import { FrameRail, InertiaRailLink } from './frame-rail';
import { NavUser } from './nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from './ui/sidebar';
import { FrameRealmProvider, useFrameRealm, type FrameRealmContext } from '../frame/realm';

/**
 * The app rail (ux-walkthrough UX-12a). Its top names the realm and offers "← Back to {workspace}" outside the default
 * workspace (IA-4, RealmHeader). Its body is the realm's projected nav (FrameRail, the packaged RealmNav). Its footer
 * is the one crossing point, the user menu (IA-3, RealmSwitcher via NavUser). The brand mark links to the CURRENT
 * realm's home. The former starter-kit "Platform → Dashboard" fallback is gone: the realm's own nav links its home.
 *
 * The tenant rail keeps its Account group (Billing, API tokens, Team): since starter de4f17b nothing else draws the
 * `accountNav` seats, and moving them into the `user` realm is UX-12b's (IA-13), not this slice's.
 */
function accountSeats(accountNav: { items?: { title: string; href: string | null }[] } | undefined): RealmNavNode[] {
    const children = (accountNav?.items ?? [])
        .filter((item): item is { title: string; href: string } => !!item.href && item.href !== '/dashboard')
        .map((item) => ({ title: item.title, href: item.href, icon: 'settings' }));

    return children.length > 0 ? [{ title: 'Account', children }] : [];
}

export function AppSidebar({ realm }: { realm?: FrameRealmContext } = {}) {
    const page = usePage<{ realms?: HostRealms; accountNav?: { items?: { title: string; href: string | null }[] } }>();
    const pageRealm = useFrameRealm();
    const railRealm = realm ?? pageRealm;
    const { realm: current, back } = useCurrentRealm(page.props.realms, new URL(page.url, 'http://local').pathname);
    // The brand mark keeps you in the realm (IA-4): the current realm's home, else the rail realm's own.
    const home = current?.href ?? (railRealm.realm === null ? '/dashboard' : railRealm.basename);
    const account = !realm && railRealm.realm === null ? accountSeats(page.props.accountNav) : [];
    const rail = realm ? (
        <FrameRealmProvider {...realm}>
            <FrameRail />
        </FrameRealmProvider>
    ) : (
        <FrameRail />
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={home} prefetch data-realm-home="">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <RealmHeader realm={current} back={back} linkComponent={InertiaRailLink} />
            </SidebarHeader>

            <SidebarContent>
                {rail}
                {account.length > 0 && (
                    <RealmNav items={account} variant="section-groups" linkComponent={InertiaRailLink} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
