import * as react from 'react';
import { ReactNode } from 'react';
import { IngestRunData } from '@splicewire/_resources/types/ingest';
export { IngestRunData } from '@splicewire/_resources/types/ingest';
import * as _tanstack_react_query from '@tanstack/react-query';

/** A host supplies authenticated transport; no URLs or tenant state enter this package. */
interface IngestClient<TRun extends IngestRunData = IngestRunData> {
    get(id: string): Promise<TRun>;
}
interface IngestServices<TRun extends IngestRunData = IngestRunData> {
    client: IngestClient<TRun>;
    notify?: (event: {
        type: 'finished';
        run: TRun;
    }) => void;
    onError?: (error: unknown) => void;
}

/** Progress of an accepted import. Dialogs, file titles, and navigation belong to the host. */
declare function IngestProgress({ run }: {
    run: IngestRunData;
}): react.JSX.Element;

declare function IngestProvider({ services, children, }: {
    services: IngestServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useIngestServices(): IngestServices;

/** The wire has a finished flag plus the two declared terminal statuses. */
declare function isIngestFinished(run: IngestRunData): boolean;
declare function useIngestProgress(run: IngestRunData): _tanstack_react_query.DefinedUseQueryResult<IngestRunData, Error>;

export { type IngestClient, IngestProgress, IngestProvider, type IngestServices, isIngestFinished, useIngestProgress, useIngestServices };
