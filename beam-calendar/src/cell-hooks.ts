import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCellFormServices } from './cell-provider';
import type { CalendarCell, CalendarProfile, SaveCellInput } from './cell-types';

// The rehomed CalendarCellForm's react-query layer (rehome-ui §profile `hooks.ts`) — the keys +
// cache invalidation travel INSIDE the package and call the INJECTED `client`, never a bundled
// transport. Query keys mirror the app's studio/api.ts (`['compositions', 'cells', id]` /
// `['composition-profiles']`) so a host that already primes those caches shares them; a host that
// doesn't just gets an independent fetch.

/** All cells of a composition — the form reads its emergent channel set off these. */
export function useCompositionCells(compositionId?: string) {
    const { client } = useCellFormServices();
    return useQuery<CalendarCell[]>({
        queryKey: ['compositions', 'cells', compositionId],
        enabled: Boolean(compositionId),
        queryFn: () => client.listCells(compositionId as string),
    });
}

/** The composition profiles — the form resolves the calendar's real Kind ids off these. */
export function useCompositionProfiles() {
    const { client } = useCellFormServices();
    return useQuery<CalendarProfile[]>({
        queryKey: ['composition-profiles'],
        staleTime: 5 * 60_000,
        queryFn: () => client.listProfiles(),
    });
}

/** Create or edit a cell; invalidates the owning composition's cell + profile caches on success. */
export function useSaveCell(compositionId: string) {
    const { client } = useCellFormServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SaveCellInput) => client.saveCell(compositionId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compositions', 'cells', compositionId] });
        },
    });
}
