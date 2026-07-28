import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransformsServices } from './provider';
import type { RunnerTransformInput } from './types';

// Query keys internal to the package (no app namespace leaks in). The host owns the QueryClient
// (contract §1/§6) — these hooks run on whatever provider wraps the host tree.
const KEY = ['beam-transforms'] as const;

export function useTransforms() {
    const { client } = useTransformsServices();
    return useQuery({ queryKey: KEY, queryFn: () => client.list() });
}

export function useCreateTransform() {
    const { client, onError } = useTransformsServices();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: RunnerTransformInput) => client.create(input),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useUpdateTransform(id: string) {
    const { client, onError } = useTransformsServices();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: RunnerTransformInput) => client.update(id, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useDeleteTransform() {
    const { client, onError } = useTransformsServices();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => client.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useTestTransform(id: string) {
    const { client, onError } = useTransformsServices();
    return useMutation({
        mutationFn: (input: Record<string, unknown>) => client.test(id, input),
        onError: (err) => onError?.(err),
    });
}
