import { usePage } from '@inertiajs/react';
import { RealmSwitcher, type HostRealms } from '@splicewire/beam-ux/nav';
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
            label={<UserInfo user={auth.user} />}
            signOutHref="/logout"
            linkComponent={InertiaRailLink}
        />
    );
}
