import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTokensServices } from './provider';
import type { CreateTokenInput, LifecycleInput } from './types';

// Query keys are internal to the package (no app namespace leaks in). The host owns the
// QueryClient (contract §1 / §6) — these hooks run on whatever provider wraps the host tree.
const TOKENS_KEY = ['beam-accounts', 'tokens'] as const;
const PERMISSIONS_KEY = ['beam-accounts', 'permissions'] as const;

export function useTokens() {
    const { client } = useTokensServices();
    return useQuery({ queryKey: TOKENS_KEY, queryFn: () => client.list() });
}

/** Held permission-names for the scoped-create picker (the `GET me` coupling, ADR-0109). */
export function usePermissions() {
    const { client } = useTokensServices();
    return useQuery({ queryKey: PERMISSIONS_KEY, queryFn: () => client.listPermissions() });
}

// Mutations invalidate the token list on success and surface errors through the injected
// `onError` (contract §3). They do NOT toast — success feedback is the component's call via
// `notify`, and errors ride the host's own handler/net so a host with a global error toaster
// is not double-notified.
export function useCreateToken() {
    const { client, onError } = useTokensServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateTokenInput) => client.create(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useArchiveToken() {
    const { client, onError } = useTokensServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => client.archive(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
        onError: (err) => onError?.(err),
    });
}

export function usePermanentlyDeleteToken() {
    const { client, onError } = useTokensServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => client.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useRenewToken() {
    const { client, onError } = useTokensServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: LifecycleInput) => client.renew(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useRotateToken() {
    const { client, onError } = useTokensServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: LifecycleInput) => client.rotate(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useRevokeOtherSessions() {
    const { client, onError } = useTokensServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => client.revokeOtherSessions(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
        onError: (err) => onError?.(err),
    });
}
