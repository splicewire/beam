import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotify, useUxBuilderServices } from './provider';
import type { BeamUxEntryBodyData } from './types';

// The react-query data layer, INSIDE the package (rehome-ui: the surface owns its data logic). The
// transport is the injected `client`; these hooks add caching, invalidation, and feedback. Keys are
// namespaced `['beam-ux', …]` so a host's cache never collides.

const entryBodyKey = (slug: string) => ['beam-ux', 'entry-body', slug] as const;

/** Load a region's schema + body through the injected `client.loadBody`. */
export function useEntryBody(slug: string | null) {
    const { client } = useUxBuilderServices();
    return useQuery<BeamUxEntryBodyData>({
        queryKey: entryBodyKey(slug ?? ''),
        queryFn: () => client.loadBody(slug as string),
        enabled: slug != null && slug !== '',
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
        mutationFn: ({ slug, body }: { slug: string; body: Record<string, unknown> }) =>
            client.saveBody(slug, body),
        onSuccess: (data, { slug }) => {
            qc.setQueryData(entryBodyKey(slug), data);
            qc.invalidateQueries({ queryKey: entryBodyKey(slug) });
            notify({ type: 'success', message: 'Saved.' });
        },
        onError: () => {
            notify({ type: 'error', message: 'Save failed.' });
        },
    });
}
