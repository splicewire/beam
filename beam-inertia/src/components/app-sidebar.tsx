import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';
import { NavFooter } from './nav-footer';
import { NavFrame } from './nav-frame';
import { NavMain } from './nav-main';
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
import {
    FrameRealmProvider,
    useFrameRealm,
    type FrameRealmContext,
} from '../frame/realm';
import type { NavItem } from '../types';

/**
 * The rail's Dashboard item goes to the home of the realm the rail is showing.
 *
 * Unscoped (the tenant rail) that is `/dashboard`, as it always was. Scoped to a realm, it is the
 * realm's `basename` — for the operator realm `/operator`, the `operator.home` landing every starter
 * mounts — so the item beside the operator sections does not quietly leave the realm for the account
 * shell. The logo keeps pointing at `/dashboard`: it is the way back to the app, not a realm link.
 */
function mainNavItems(realm: FrameRealmContext): NavItem[] {
    return [
        {
            title: 'Dashboard',
            href: {
                method: 'get',
                url: realm.realm === null ? '/dashboard' : realm.basename,
            },
            icon: LayoutGrid,
        },
    ];
}

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar({ realm }: { realm?: FrameRealmContext } = {}) {
    // Always called (hook order); an explicit `realm` from the layout wins over the page's props.
    const pageRealm = useFrameRealm();
    const railRealm = realm ?? pageRealm;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems(railRealm)} />
                {/*
                 * The frame nav — projected server-side and, until now, rendered nowhere. It is
                 * mounted HERE rather than inside the console page so the seats are reachable from
                 * ordinary app chrome instead of only from a surface you must already be on.
                 *
                 * A layout that names a realm (`OperatorLayout`) scopes ONLY this rail to it, so the
                 * rail reads that realm's manifest while the page keeps its own.
                 */}
                {realm ? (
                    <FrameRealmProvider {...realm}>
                        <NavFrame />
                    </FrameRealmProvider>
                ) : (
                    <NavFrame />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
