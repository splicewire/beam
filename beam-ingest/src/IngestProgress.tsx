import { Button } from '@schemastud/ui';
import { useIngestProgress } from './hooks';
import type { IngestRunData } from './types';

/** Progress of an accepted import. Dialogs, file titles, and navigation belong to the host. */
export function IngestProgress({ run }: { run: IngestRunData }) {
    const progress = useIngestProgress(run);
    const current = progress.data;
    if (progress.isError) {
        return (
            <div role="alert" className="space-y-3 text-sm">
                <p>
                    {progress.error instanceof Error
                        ? progress.error.message
                        : 'Could not check import progress.'}
                </p>
                <p className="text-muted-foreground">The import may still be running.</p>
                <Button
                    variant="outline"
                    disabled={progress.isFetching}
                    onClick={() => void progress.refetch()}
                >
                    {progress.isFetching ? 'Checking…' : 'Retry'}
                </Button>
            </div>
        );
    }
    if (current.status === 'failed') {
        return (
            <p role="alert" className="text-sm text-destructive">
                {current.error ?? 'Import failed.'}
            </p>
        );
    }
    return (
        <p role="status" className="text-sm" aria-live="polite">
            {current.status === 'completed' ? 'Import completed.' : `Import ${current.status}.`}
            {current.totalRows != null && (
                <>
                    {' '}
                    {current.currentRow ?? 0} of {current.totalRows} rows.
                </>
            )}
        </p>
    );
}
