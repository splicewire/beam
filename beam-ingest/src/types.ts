import type { IngestRunData } from '@splicewire/_resources/types/ingest';

export type { IngestRunData };

/** A host supplies authenticated transport; no URLs or tenant state enter this package. */
export interface IngestClient<TRun extends IngestRunData = IngestRunData> {
    get(id: string): Promise<TRun>;
}
export interface IngestServices<TRun extends IngestRunData = IngestRunData> {
    client: IngestClient<TRun>;
    notify?: (event: { type: 'finished'; run: TRun }) => void;
    onError?: (error: unknown) => void;
}
