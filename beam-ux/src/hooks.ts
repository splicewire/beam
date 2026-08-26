import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotify, useUxBuilderServices } from './provider';
import type { BeamUxEntryBodyData } from './types';

// The react-query data layer, INSIDE the package (rehome-ui: the surface owns its data logic). The
// transport is the injected `client`; these hooks add caching, invalidation, and feedback. Keys are
// namespaced `['beam-ux', …]` so a host's cache never collides.
//
// The cache key is the entry ID, not its slug (ADR-0214 §2). That is not merely a rename: a slug was
// never a unique key for an entry (a `theme`-namespaced override and a null-namespace page can share
// one), so two distinct entries could collide on one cache entry here and serve each other's body.

const entryBodyKey = (id: string) => ['beam-ux', 'entry-body', id] as const;

/** Load a region's schema + body through the injected `client.loadBody`, addressed by entry id. */
export function useEntryBody(id: string | null) {
    const { client } = useUxBuilderServices();
    return useQuery<BeamUxEntryBodyData>({
        queryKey: entryBodyKey(id ?? ''),
        queryFn: () => client.loadBody(id as string),
        enabled: id != null && id !== '',
    });
}

/**
 * Save a region's body through the injected `client.saveBody`. On success it seeds the fresh
 * projection back into the query cache, invalidates the entry-body key, and fires the feedback sink.
 */
export function useSaveEntryBody() {
    const { client } = useUxBuilderServices();
    const notify = useNotify();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
            client.saveBody(id, body),
        onSuccess: (data, { id }) => {
            qc.setQueryData(entryBodyKey(id), data);
            qc.invalidateQueries({ queryKey: entryBodyKey(id) });
            notify({ type: 'success', message: 'Saved.' });
        },
        onError: () => {
            notify({ type: 'error', message: 'Save failed.' });
        },
    });
}
