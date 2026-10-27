import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotify, useUxBuilderServices } from './provider';
import type { BeamUxEntryBodyData, EntryBody } from './types';

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
 * Save a region's body through the host's declared write contract. Hosts that expose the optional
 * publication seam record a draft against the current head; legacy hosts retain immediate publish.
 * On success it seeds the fresh projection back into the query cache, invalidates the entry-body
 * key, and fires the feedback sink.
 */
export function useSaveEntryBody() {
    const { client } = useUxBuilderServices();
    const notify = useNotify();
    const qc = useQueryClient();
    const savesDraft = Boolean(client.saveDraft && client.listVersions);
    const mutation = useMutation({
        mutationFn: async ({ id, body }: { id: string; body: EntryBody }) => {
            if (client.saveDraft && client.listVersions) {
                const current = await client.listVersions(id);
                return client.saveDraft(id, body, current.headVersion, 'UX builder draft');
            }

            return client.saveBody(id, body);
        },
        onSuccess: (data, { id }) => {
            // The draft op returns publication state, not the body DTO cached by useEntryBody.
            // Keep the existing body projection until its invalidation fetch replaces it.
            if (!savesDraft) {
                qc.setQueryData(entryBodyKey(id), data);
            }
            qc.invalidateQueries({ queryKey: entryBodyKey(id) });
            notify({
                type: 'success',
                message: savesDraft ? 'Draft saved.' : 'Saved.',
            });
        },
        onError: () => {
            notify({ type: 'error', message: 'Save failed.' });
        },
    });

    return {
        ...mutation,
        saveLabel: savesDraft ? 'Save draft' : undefined,
    };
}

/** Read existing Release projections; an absent or refused port is not an empty list. */
export function useRegionPreviews(entryId: string) {
    const { client } = useUxBuilderServices();
    const query = useQuery({
        queryKey: ['beam-ux', 'region-releases'],
        queryFn: () => client.listReleases!(),
        enabled: Boolean(client.listReleases),
        retry: false,
    });
    const previewState =
        !client.listReleases || query.isError
            ? ('unavailable' as const)
            : query.isPending
            ? ('loading' as const)
            : ('ready' as const);
    const previews = (query.data ?? [])
        .filter(
            (release) =>
                ['draft', 'in_review', 'approved', 'scheduled'].includes(release.status) &&
                release.members.some((member) => member.entryId === entryId)
        )
        .map((release) => ({
            id: release.id,
            title: release.title,
            href: release.previewHref ?? null,
        }));
    return { previews, previewState };
}
