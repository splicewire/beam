import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resourceQueryKey, useFrameInjection } from '@schemastud/frame';

/** The `notifications` resource (laravel-beam-notifications, attention-surfaces 09): the signed-in reader's own rows. */
export const NOTIFICATIONS_RESOURCE = 'notifications';

/**
 * One stored notification as the resource serves it (laravel-beam-notifications `StoredNotificationData`; its generated
 * type is `Splicewire.Beam.Notifications.Data.StoredNotificationData` in a host's tree). Text is already rendered for the
 * reader by the server; the link is shown exactly as stored.
 */
export interface StoredNotification {
    id: string;
    text: string | null;
    kind: string | null;
    link: string | null;
    unread: boolean;
    createdAt: string | null;
}

/** Ruling 8: the unread figure on a 60 second poll; no broadcast. */
export const UNREAD_POLL_MS = 60_000;

/** The reader's unread count: the resource's summary figure `unread`, through the realm kit's transport (48-1). */
export function useUnreadNotificationCount(pollMs: number = UNREAD_POLL_MS) {
    const { transport } = useFrameInjection();

    return useQuery({
        queryKey: resourceQueryKey(transport, NOTIFICATIONS_RESOURCE, 'summary'),
        queryFn: async () => {
            const summary = await transport.summary(NOTIFICATIONS_RESOURCE, {});
            const unread = summary.figures.find((figure) => figure.key === 'unread')?.value;

            return typeof unread === 'number' && Number.isSafeInteger(unread) && unread >= 0 ? unread : 0;
        },
        refetchInterval: pollMs,
        staleTime: pollMs,
    });
}

/** Ruling 8: "Recent" refreshes on open. The newest `limit` rows (the resource lists newest first). */
export function useRecentNotifications(open: boolean, limit: number) {
    const { transport } = useFrameInjection();

    return useQuery({
        queryKey: resourceQueryKey(transport, NOTIFICATIONS_RESOURCE, 'recent', limit),
        queryFn: async () => (await transport.list<StoredNotification>(NOTIFICATIONS_RESOURCE, { per_page: String(limit) })).data,
        enabled: open,
        staleTime: 0,
        refetchOnMount: 'always',
    });
}

/**
 * Mark one read (`read`, with its id) or all read (`read-all`): the resource's DECLARED actions (attention-surfaces 10),
 * taken from the realm manifest and run by the kit transport's `invoke`, never a hand-written request. Afterwards every
 * cached notifications read refreshes, so the unread dot and the rows agree.
 */
export function useMarkNotificationsRead(failedMessage: string) {
    const { transport, manifestFor, notify } = useFrameInjection();
    const client = useQueryClient();
    const actions = manifestFor?.(NOTIFICATIONS_RESOURCE)?.actions ?? [];

    const mutation = useMutation({
        mutationFn: async (target: { key: 'read' | 'read-all'; id?: string }) => {
            const action = actions.find((candidate) => candidate.key === target.key);
            if (!action || !transport.invoke) throw new Error(`The notifications resource declares no [${target.key}] action here.`);

            return transport.invoke(action, { id: target.id ?? null });
        },
        // A refused or failed write reaches the host's one notice sink (66-1), never a silent no-op.
        onError: () => notify?.({ tone: 'error', message: failedMessage }),
        onSettled: () => client.invalidateQueries({ queryKey: ['frame', NOTIFICATIONS_RESOURCE] }),
    });

    return {
        markRead: (id: string) => mutation.mutate({ key: 'read', id }),
        markAllRead: () => mutation.mutate({ key: 'read-all' }),
        canMarkRead: actions.some((action) => action.key === 'read') && Boolean(transport.invoke),
        canMarkAllRead: actions.some((action) => action.key === 'read-all') && Boolean(transport.invoke),
        pending: mutation.isPending,
    };
}
