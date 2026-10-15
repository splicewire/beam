import { usePage } from '@inertiajs/react';
import { RealmSwitcher, type HostRealms } from '@splicewire/beam-ux/nav';
import { ChevronsUpDown } from 'lucide-react';
import { InertiaRailLink } from './frame-rail';
import { UserInfo } from './user-info';

/**
 * The user menu IS the realm switcher (ux-walkthrough UX-12a, IA-3): the one place realms are crossed (App,
 * Settings, Operator when the payload offers it), plus View site and Sign out (the GET confirm page, IA-5).
 */
export function NavUser() {
    const { auth, realms } = usePage<{ auth: { user: Parameters<typeof UserInfo>[0]['user'] | null }; realms?: HostRealms }>().props;

    if (!auth.user || !realms) {
        return null;
    }

    return (
        <RealmSwitcher
            realms={realms}
            // The chip is a sidebar menu button: a full-width flex ROW (so the avatar and name sit
            // side-by-side rather than stacking) with the rail's hover/open chrome, and the
            // ChevronsUpDown is the menu-control affordance. RealmSwitcher's trigger is otherwise
            // unstyled by design, so the chip chrome is supplied here (the IA-3 consolidation that
            // moved the user menu onto RealmSwitcher had dropped the old SidebarMenuButton chrome).
            triggerClassName="group flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-accent-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
            label={
                <>
                    <UserInfo user={auth.user} />
                    <ChevronsUpDown className="ml-auto size-4" />
                </>
            }
            signOutHref="/logout"
            linkComponent={InertiaRailLink}
            // The user menu sits at the foot of the sidebar, so it opens upward.
            side="top"
        />
    );
}
