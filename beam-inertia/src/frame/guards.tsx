import { usePage } from '@inertiajs/react';
import { createGuardRegistry, type GuardRegistry } from '@schemastud/frame';
import type { HostRealms } from '@splicewire/beam-ux/nav';
import type { ReactNode } from 'react';

/**
 * The operator realm's client door (the `root` guard key laravel-beam's RealmRegistry stamps on every operator leaf).
 * It admits exactly whom the host's realms payload (`HostIaData`, shared as the `realms` page prop) offers an UNLOCKED
 * operator realm: the payload's own decision, so an `os.operate` operator who is not Root is admitted wherever the host
 * says so, and the rule matches the flagship's RequireRoot. No payload, or no unlocked operator realm, refuses. The
 * server still authorizes every read; this keeps a refused principal from a page of 403s.
 */
export function RequireOperatorRealm({ children }: { children: ReactNode }) {
    const { realms } = usePage<{ realms?: HostRealms }>().props;
    const offered = (realms?.realms ?? []).some((realm) => realm.key === 'operator' && !realm.locked);

    if (!offered) {
        return (
            <div role="alert" data-page-state="forbidden" className="p-6 text-sm">
                <p className="font-medium">This operator page is not available to you.</p>
            </div>
        );
    }

    return <>{children}</>;
}

/** The guards this host binds: every key a realm stamps on its leaves (today only the operator realm's `root`). */
export function createFrameGuards(): GuardRegistry {
    const guards = createGuardRegistry();
    guards.registerGuard('root', RequireOperatorRealm);

    return guards;
}
