import { useMemo } from 'react';
import type { HostRealm, HostRealms } from './types.js';

/** The workspace realm every other realm goes "Back" to: `tenant`, else the first app-surface realm. */
function defaultRealm(data: HostRealms): HostRealm | undefined {
    return data.realms.find((r) => r.key === 'tenant') ?? data.realms.find((r) => r.surface === 'app');
}

function pathOf(href: string): string {
    try {
        return new URL(href, 'http://local').pathname.replace(/\/+$/, '') || '/';
    } catch {
        return href;
    }
}

/**
 * You are here (ux-walkthrough IA-4, M7): which realm `pathname` is in, and where "← Back to {workspace}" goes. The
 * realm is the one whose home is the LONGEST prefix of the path, because an SPA navigates without refetching the
 * payload. It falls back to the server's `current`, then to the default workspace. `back` exists only outside the default workspace, and prefers the
 * server's own `back`. This replaces each shell's `startsWith('/operator')` checks.
 */
export function useCurrentRealm(data: HostRealms | null | undefined, pathname: string) {
    return useMemo(() => {
        if (!data) {
            return { realm: null, back: null } as const;
        }

        const path = pathname.replace(/\/+$/, '') || '/';
        let realm: HostRealm | null = null;
        let best = -1;
        for (const candidate of data.realms) {
            const home = pathOf(candidate.href);
            const matches = home === '/' ? path === '/' : path === home || path.startsWith(home + '/');
            if (matches && home.length > best) {
                realm = candidate;
                best = home.length;
            }
        }
        // No home claims the path: the server's `current`, else the default workspace (an SPA reads the payload once,
        // without a path, so its `current` is null; a page no realm claims is in the workspace, app-walkthrough APP-14).
        realm ??= data.realms.find((r) => r.key === data.current) ?? defaultRealm(data) ?? null;

        const home = defaultRealm(data);
        const back =
            realm && home && realm.key !== home.key && realm.surface === 'app'
                ? (data.back ?? { label: home.label, href: home.href })
                : null;

        return { realm, back } as const;
    }, [data, pathname]);
}
