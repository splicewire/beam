import { useRef, useState, type ReactNode } from 'react';
import { Badge, Button } from '@schemastud/ui';
import type { CalendarActionRecordData } from '@splicewire/beam-resources/types/calendar-actions';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';

function instantLabel(value: string, timezone: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, { timeZone: timezone, dateStyle: 'medium', timeStyle: 'long' }).format(new Date(value));
    } catch { return value; }
}

/** The committed action and its immutable attempt history; host callbacks carry authorization and transport. */
export function WorkflowActionDetail({ action, subject, onCancel, onRetry, onEdit, renderResult }: {
    action: CalendarActionRecordData;
    subject?: ReactNode;
    onCancel?: () => Promise<void>;
    onRetry?: () => Promise<void>;
    onEdit?: () => void;
    renderResult?: (result: CalendarActionRecordData['attempts'][number]['result']) => ReactNode;
}) {
    const [pending, setPending] = useState(false);
    const busy = useRef(false);
    const [error, setError] = useState<string | null>(null);
    async function run(callback: () => Promise<void>) {
        if (busy.current) return;
        busy.current = true; setPending(true); setError(null);
        try { await callback(); }
        catch (failure) { setError(failure instanceof Error ? failure.message : 'This action could not be updated. Refresh its details and try again.'); }
        finally { busy.current = false; setPending(false); }
    }
    const transition = typeof action.payload.transition === 'string' ? humanizeWorkflowKey(action.payload.transition) : 'Workflow transition';
    return (
        <section className="space-y-4" aria-label={`${transition} schedule`} aria-busy={pending}>
            <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{transition}</h3>
                <Badge variant="outline">{humanizeWorkflowKey(action.status)}</Badge>
            </div>
            {subject}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Scheduled for</dt>
                <dd><time dateTime={action.due_at}>{instantLabel(action.due_at, action.timezone)}</time></dd>
                <dt className="text-muted-foreground">Timezone</dt><dd className="break-words">{action.timezone}</dd>
            </dl>
            {action.status === 'pending' ? <p className="text-sm text-muted-foreground">Waiting to run. Workflow checks and permission will be checked again.</p> : null}
            {action.status === 'blocked' ? <p className="text-sm text-muted-foreground">The workflow did not advance. Resolve the blockers below, then retry explicitly.</p> : null}
            {action.status === 'failed' ? <p className="text-sm text-muted-foreground">The attempt failed. Review its outcome before retrying.</p> : null}
            {action.status === 'cancelled' ? <p className="text-sm text-muted-foreground">This schedule was cancelled.</p> : null}
            <div className="flex flex-wrap gap-2">
                {action.status === 'pending' && onEdit ? <Button variant="outline" disabled={pending} onClick={onEdit}>Reschedule</Button> : null}
                {action.status === 'pending' && onCancel ? <Button variant="outline" disabled={pending} onClick={() => void run(onCancel)}>Cancel schedule</Button> : null}
                {['blocked', 'failed'].includes(action.status) && onRetry ? <Button disabled={pending} onClick={() => void run(onRetry)}>Retry now</Button> : null}
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold">Attempt history</h4>
                {action.attempts.length === 0 ? <p className="text-sm text-muted-foreground">No attempts have been recorded.</p> : null}
                <ol className="divide-y divide-border">
                    {action.attempts.map((attempt) => (
                        <li key={attempt.id} className="space-y-2 py-3 text-sm">
                            <p className="font-medium">Attempt {attempt.number}: {humanizeWorkflowKey(attempt.status)}</p>
                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                <dt className="text-muted-foreground">Intended</dt><dd><time dateTime={attempt.due_at}>{instantLabel(attempt.due_at, action.timezone)}</time></dd>
                                {attempt.started_at ? <><dt className="text-muted-foreground">Started</dt><dd><time dateTime={attempt.started_at}>{instantLabel(attempt.started_at, action.timezone)}</time></dd></> : null}
                                {attempt.completed_at ? <><dt className="text-muted-foreground">{attempt.status === 'applied' ? 'Applied' : 'Finished'}</dt><dd><time dateTime={attempt.completed_at}>{instantLabel(attempt.completed_at, action.timezone)}</time></dd></> : null}
                            </dl>
                            {attempt.blockers.length ? <ul className="list-disc space-y-1 pl-5">{attempt.blockers.map((blocker, index) => <li key={index}>{blocker}</li>)}</ul> : null}
                            {renderResult?.(attempt.result)}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
