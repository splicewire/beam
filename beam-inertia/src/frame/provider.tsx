import type { ReactNode } from 'react';
import { kitFor } from './kit';
import { useFrameRealm } from './realm';

/**
 * Mounts the surrounding realm's frame kit (`kitFor`, one per realm at module scope).
 *
 * Mounted twice for one realm — a console inside a layout that already mounts it — the inner one
 * is a pass-through, because both render the same kit's `Provider`.
 */
export function TenantFrameProvider({ children }: { children: ReactNode }) {
    const { Provider } = kitFor(useFrameRealm().manifestUrl);

    return <Provider>{children}</Provider>;
}
