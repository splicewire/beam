import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAutoReloadServices } from './provider';
import type { AutoReloadConfigUpdate } from './types';

// Query keys are package-namespaced (no app namespace leaks in). The host owns the
// QueryClient — these hooks run on whatever provider wraps the host tree.
const CONFIG_KEY = ['beam-commerce', 'auto-reload'] as const;
const ACTIVITY_KEY = ['beam-commerce', 'auto-reload', 'activity'] as const;

export function useAutoReloadConfig() {
    const { client } = useAutoReloadServices();
    return useQuery({ queryKey: CONFIG_KEY, queryFn: () => client.getConfig() });
}

export function useAutoReloadActivity() {
    const { client } = useAutoReloadServices();
    return useQuery({ queryKey: ACTIVITY_KEY, queryFn: () => client.getActivity() });
}

// The update invalidates both the config and the activity ledger on success (a reload the save
// may have re-armed shows up), and surfaces errors through the injected `onError`. Success
// feedback is the card's own call via `notify`.
export function useUpdateAutoReloadConfig() {
    const { client, onError } = useAutoReloadServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: AutoReloadConfigUpdate) => client.updateConfig(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
            await queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY });
        },
        onError: (err) => onError?.(err),
    });
}
