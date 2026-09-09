import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IngestProvider } from './provider';
import type { IngestClient, IngestRunData, IngestServices } from './types';

/** Pure generated-DTO fixture; never contacts a host. */
export const pendingRun: IngestRunData = {
    id: 'sample-ingest',
    kind: 'spreadsheet',
    status: 'pending',
    fileName: 'sample.csv',
    startedAt: null,
    finishedAt: null,
    currentRow: null,
    totalRows: null,
    error: null,
    started: false,
    finished: false,
};
export const runningRun: IngestRunData = {
    ...pendingRun,
    status: 'running',
    started: true,
    startedAt: '2026-09-09T12:00:00Z',
    currentRow: 25,
    totalRows: 100,
};
export const completedRun: IngestRunData = {
    ...runningRun,
    status: 'completed',
    finished: true,
    finishedAt: '2026-09-09T12:01:00Z',
    currentRow: 100,
};
export const failedRun: IngestRunData = {
    ...runningRun,
    status: 'failed',
    finished: true,
    finishedAt: '2026-09-09T12:01:00Z',
    error: 'The spreadsheet could not be read.',
};

export function IngestStage({
    run,
    client,
    children,
}: {
    run: IngestRunData;
    client?: IngestClient;
    children: ReactNode;
}) {
    const [queryClient] = useState(
        () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    const services = useMemo<IngestServices>(
        () => ({ client: client ?? { get: async () => run } }),
        [client, run],
    );
    return (
        <QueryClientProvider client={queryClient}>
            <IngestProvider services={services}>
                <div className="w-full rounded-lg border bg-card p-4 text-card-foreground">
                    {children}
                </div>
            </IngestProvider>
        </QueryClientProvider>
    );
}
