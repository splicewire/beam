import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { FrameProvider, useFrameInjection, type FrameInjection, type FrameTransport } from '@schemastud/frame';

type UseUrlState = FrameInjection['useUrlState'];

/**
 * A list's own query state (filters, sort, page, collection), held in memory: one store per call, shared by every
 * component under the provider that reads it. ListShell, the facets bar and pagination all read and write
 * `useUrlState`, so lists mounted side by side under one provider would page, sort and filter each other.
 *
 * Frame has the same store (`createMemoryUrlState`, its record picker's), but exports it only from `./testing`. This is
 * that store without its `fixed` parameters; frame exporting it from its root would let this file go.
 */
function createOwnUrlState(): UseUrlState {
    let current = new URLSearchParams();
    const listeners = new Set<() => void>();
    const snapshot = () => current;
    const subscribe = (notify: () => void) => {
        listeners.add(notify);
        return () => {
            listeners.delete(notify);
        };
    };
    return function useOwnUrlState() {
        const params = useSyncExternalStore(subscribe, snapshot, snapshot);
        return [
            params,
            (updater: (previous: URLSearchParams) => URLSearchParams) => {
                current = updater(new URLSearchParams(current));
                listeners.forEach((notify) => notify());
            },
        ] as const;
    };
}

/**
 * The host's frame injection, re-scoped for one list among several: its own query state and, when given, a narrowed
 * transport. Everything else (primitives, registry, manifest, `can`, the query client) is the host's.
 */
export function NestedFrame({ transport, children }: { transport?: FrameTransport; children: ReactNode }) {
    const injection = useFrameInjection();
    const [useUrlState] = useState(createOwnUrlState);
    const value = useMemo(
        () => ({ ...injection, useUrlState, ...(transport ? { transport } : {}) }),
        [injection, useUrlState, transport],
    );

    return (
        // frame:override a nested re-scope: this list keeps its own filters, sort and page (and, for one party's history, a narrowed transport) so it never mixes them with the host's list or a sibling list; the host's kit supplies everything else.
        <FrameProvider value={value}>{children}</FrameProvider>
    );
}
