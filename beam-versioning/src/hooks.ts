import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVersionsServices } from './provider';
import type { SaveVersionInput } from './types';

// Query keys are internal to the package (no app namespace leaks in). The host owns the
// QueryClient (contract §1 / §6) — these hooks run on whatever provider wraps the host tree.
// The optional `scope` (a record id) is folded in so one host QueryClient can serve many records
// off one static prefix without cross-talk (contract §6).
const VERSIONS_PREFIX = ['beam-versioning', 'versions'] as const;

function useVersionsKey() {
    const { scope } = useVersionsServices();
    const suffix = scope === undefined ? [] : Array.isArray(scope) ? scope : [scope];
    return [...VERSIONS_PREFIX, ...suffix];
}

export function useVersions() {
    const { client } = useVersionsServices();
    const queryKey = useVersionsKey();
    return useQuery({ queryKey, queryFn: () => client.list() });
}

// Mutations invalidate the version list on success and surface errors through the injected
// `onError` (contract §3). They do NOT toast — success feedback is the caller's call via `notify`.
export function useSaveVersion() {
    const { client, onError } = useVersionsServices();
    const queryKey = useVersionsKey();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SaveVersionInput = {}) => client.save(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
        onError: (err) => onError?.(err),
    });
}

export function useRestoreVersion() {
    const { client, onError } = useVersionsServices();
    const queryKey = useVersionsKey();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ref, input = {} }: { ref: string; input?: SaveVersionInput }) =>
            client.restore(ref, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
        onError: (err) => onError?.(err),
    });
}
