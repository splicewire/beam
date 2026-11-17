import type { ClientCatalog } from '@schemastud/messages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { IngestProgress } from '../src/IngestProgress';
import { IngestProvider } from '../src/provider';
import { completedRun, pendingRun } from '../src/story-harness';
import type { IngestRunData } from '../src/types';

// Localization 30 part S2: beam-ingest's progress copy reads the reader's catalog through the seam; the run's status
// passes through as the server sent it. The provider module is loaded lazily, so at the parent these render English
// and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ingest::messages.status_running': { text: 'Importación en curso.', sourceLocale: 'es' },
        'splicewire-beam-ingest::messages.completed': { text: 'Importación completada.', sourceLocale: 'es' },
        'splicewire-beam-ingest::messages.rows': { text: ':current de :total fila.|:current de :total filas.', sourceLocale: 'es' },
    },
};
type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
let provider: Provider | null | undefined;
async function messageProvider(): Promise<Provider | null> {
    if (provider !== undefined) return provider;
    try {
        provider = (await import('@schemastud/messages/react')).MessageProvider as Provider;
    } catch {
        provider = null;
    }
    return provider;
}
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={catalog}>{children}</Provider> : children;
}

const clients: QueryClient[] = [];
afterEach(() => {
    cleanup();
    clients.splice(0).forEach((client) => client.clear());
});
async function mount(run: IngestRunData) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    clients.push(queryClient);
    const get = vi.fn(() => new Promise<IngestRunData>(() => {}));
    render(await inLocale(spanish, (
        <QueryClientProvider client={queryClient}>
            <IngestProvider services={{ client: { get } }}>
                <IngestProgress run={run} />
            </IngestProvider>
        </QueryClientProvider>
    )));
}

it('reports a running import in Spanish, its row count on the plural line', async () => {
    await mount({ ...pendingRun, status: 'running', currentRow: 25, totalRows: 100 });
    expect(screen.getByRole('status').textContent).toBe('Importación en curso. 25 de 100 filas.');
});

it('reports completion in Spanish', async () => {
    await mount(completedRun);
    expect(screen.getByRole('status').textContent).toContain('Importación completada.');
});
