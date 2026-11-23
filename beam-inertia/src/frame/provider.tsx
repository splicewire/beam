import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { recordPageAbilities } from './abilities';
import { kitFor } from './kit';
import { useFrameRealm } from './realm';

/**
 * Mounts the surrounding realm's frame kit (`kitFor`, one per realm at module scope) — any realm, tenant or operator,
 * so the public name is realm-neutral (frame-foundation 92). A host page mounts it under `FrameRealmProvider`.
 *
 * Mounted twice for one realm — a console inside a layout that already mounts it — the inner one
 * is a pass-through, because both render the same kit's `Provider`.
 */
export function BeamFrameProvider({ children }: { children: ReactNode }) {
    const { Provider } = kitFor(useFrameRealm().manifestUrl);
    // What a host's kit bindings read (agreements 06): the page's own ability map, current as of this render.
    recordPageAbilities((usePage() as { props?: { can?: unknown } } | undefined)?.props?.can);

    return <Provider>{children}</Provider>;
}
