import { Button } from '@schemastud/ui';
import { useIngestProgress } from './hooks';
import type { IngestRunData } from './types';
import { useBeamIngestMessages, type BeamIngestMessageKey } from './messages';

/**
 * The run statuses the server declares (IngestRunStatus) that read as a progress line, each its own catalog line;
 * `failed` renders the run's error. A value outside the set still reads `Import :status.`, the value as given.
 */
const STATUS_LINE: Record<string, BeamIngestMessageKey> = {
    pending: 'splicewire-beam-ingest::messages.status_pending',
    running: 'splicewire-beam-ingest::messages.status_running',
    completed: 'splicewire-beam-ingest::messages.completed',
};

/** Progress of an accepted import. Dialogs, file titles, and navigation belong to the host. */
export function IngestProgress({ run }: { run: IngestRunData }) {
    const m = useBeamIngestMessages();
    const progress = useIngestProgress(run);
    const current = progress.data;
    if (progress.isError) {
        return (
            <div role="alert" className="space-y-3 text-sm">
                <p>
                    {progress.error instanceof Error
                        ? progress.error.message
                        : m.t('splicewire-beam-ingest::messages.progress_failed')}
                </p>
                <p className="text-muted-foreground">{m.t('splicewire-beam-ingest::messages.may_still_run')}</p>
                <Button
                    variant="outline"
                    disabled={progress.isFetching}
                    onClick={() => void progress.refetch()}
                >
                    {progress.isFetching ? m.t('splicewire-beam-ingest::messages.checking') : m.t('splicewire-beam-ingest::messages.retry')}
                </Button>
            </div>
        );
    }
    if (current.status === 'failed') {
        return (
            <p role="alert" className="text-sm text-destructive">
                {current.error ?? m.t('splicewire-beam-ingest::messages.failed')}
            </p>
        );
    }
    return (
        <p role="status" className="text-sm" aria-live="polite">
            {Object.hasOwn(STATUS_LINE, current.status) ? m.t(STATUS_LINE[current.status]) : m.t('splicewire-beam-ingest::messages.status', { status: current.status })}
            {current.totalRows != null && (
                <>
                    {' '}
                    {m.choice('splicewire-beam-ingest::messages.rows', current.totalRows, { current: current.currentRow ?? 0, total: current.totalRows })}
                </>
            )}
        </p>
    );
}
