import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIngestServices } from './provider';
import type { IngestRunData } from './types';

/** The wire has a finished flag plus the two declared terminal statuses. */
export function isIngestFinished(run: IngestRunData): boolean {
    return run.finished || run.status === 'completed' || run.status === 'failed';
}

export function useIngestProgress(run: IngestRunData) {
    const services = useIngestServices();
    const notified = useRef(new Set<string>());
    const lastError = useRef<{ id: string; updatedAt: number } | null>(null);
    const progress = useQuery({
        queryKey: ['beam-ingest', run.id],
        queryFn: () => services.client.get(run.id),
        initialData: run,
        enabled: (query) => !isIngestFinished(query.state.data ?? run),
        refetchOnMount: (query) => !query.state.error && !isIngestFinished(query.state.data ?? run),
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: (query) =>
            query.state.error || (query.state.data && isIngestFinished(query.state.data))
                ? false
                : 1500,
    });
    const current = progress.data;
    useEffect(() => {
        if (isIngestFinished(current) && !notified.current.has(current.id)) {
            notified.current.add(current.id);
            services.notify?.({ type: 'finished', run: current });
        }
    }, [current, services]);
    useEffect(() => {
        if (
            progress.isError &&
            (!lastError.current ||
                lastError.current.id !== run.id ||
                lastError.current.updatedAt !== progress.errorUpdatedAt)
        ) {
            lastError.current = { id: run.id, updatedAt: progress.errorUpdatedAt };
            services.onError?.(progress.error);
        }
    }, [progress.isError, progress.error, progress.errorUpdatedAt, services, run.id]);
    return progress;
}
