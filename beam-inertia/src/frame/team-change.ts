import type { QueryClient } from '@tanstack/react-query';

/** Team selection changes both resource reach and cached rows, across every realm/socket. */
export async function resetFrameAfterTeamChange(client: QueryClient): Promise<void> {
    await Promise.all([
        ['frame'],
        // Frame's facet queries live outside its resource/manifest prefix.
        ['filter-schema'],
        ['filter-variants'],
        ['filter-options'],
        ['saved-filters'],
    ].map((queryKey) => client.resetQueries({ queryKey })));
}
