import { useRef, useState, type ReactNode } from 'react';
import { Badge, Button } from '@schemastud/ui';
import type { CalendarActionRecordData } from '@splicewire/beam-resources/types/calendar-actions';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import { notice, say, type Notice } from './message-descriptor';
import { useBeamWorkflowsMessages } from './messages';

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
    const m = useBeamWorkflowsMessages();
    const [error, setError] = useState<Notice | null>(null);
    async function run(callback: () => Promise<void>) {
        if (busy.current) return;
        busy.current = true; setPending(true); setError(null);
        try { await callback(); }
        catch (failure) { setError(failure instanceof Error ? failure.message : notice('splicewire-beam-workflows::messages.detail_update_failed')); }
        finally { busy.current = false; setPending(false); }
    }
    const transition = typeof action.payload.transition === 'string'
        ? humanizeWorkflowKey(action.payload.transition)
        : m.t('splicewire-beam-workflows::messages.detail_workflow_transition');
    return (
        <section className="space-y-4" aria-label={m.t('splicewire-beam-workflows::messages.detail_schedule_label', { transition })} aria-busy={pending}>
            <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{transition}</h3>
                <Badge variant="outline">{humanizeWorkflowKey(action.status)}</Badge>
            </div>
            {subject}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_scheduled_for')}</dt>
                <dd><time dateTime={action.due_at}>{instantLabel(action.due_at, action.timezone)}</time></dd>
                <dt className="text-muted-foreground">{m.t('splicewire-beam-workflows::messages.timezone')}</dt><dd className="break-words">{action.timezone}</dd>
            </dl>
            {action.status === 'pending' ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_pending')}</p> : null}
            {action.status === 'blocked' ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_blocked')}</p> : null}
            {action.status === 'failed' ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_failed')}</p> : null}
            {action.status === 'cancelled' ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_cancelled')}</p> : null}
            <div className="flex flex-wrap gap-2">
                {action.status === 'pending' && onEdit ? <Button variant="outline" disabled={pending} onClick={onEdit}>{m.t('splicewire-beam-workflows::messages.detail_reschedule')}</Button> : null}
                {action.status === 'pending' && onCancel ? <Button variant="outline" disabled={pending} onClick={() => void run(onCancel)}>{m.t('splicewire-beam-workflows::messages.detail_cancel_schedule')}</Button> : null}
                {['blocked', 'failed'].includes(action.status) && onRetry ? <Button disabled={pending} onClick={() => void run(onRetry)}>{m.t('splicewire-beam-workflows::messages.detail_retry_now')}</Button> : null}
            </div>
            {error ? <p role="alert" className="text-sm text-destructive">{say(m, error)}</p> : null}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold">{m.t('splicewire-beam-workflows::messages.detail_attempt_history')}</h4>
                {action.attempts.length === 0 ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_no_attempts')}</p> : null}
                <ol className="divide-y divide-border">
                    {action.attempts.map((attempt) => (
                        <li key={attempt.id} className="space-y-2 py-3 text-sm">
                            <p className="font-medium">{m.t('splicewire-beam-workflows::messages.detail_attempt', { number: attempt.number, status: humanizeWorkflowKey(attempt.status) })}</p>
                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                <dt className="text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_intended')}</dt><dd><time dateTime={attempt.due_at}>{instantLabel(attempt.due_at, action.timezone)}</time></dd>
                                {attempt.started_at ? <><dt className="text-muted-foreground">{m.t('splicewire-beam-workflows::messages.detail_started')}</dt><dd><time dateTime={attempt.started_at}>{instantLabel(attempt.started_at, action.timezone)}</time></dd></> : null}
                                {attempt.completed_at ? <><dt className="text-muted-foreground">{m.t(attempt.status === 'applied' ? 'splicewire-beam-workflows::messages.detail_applied' : 'splicewire-beam-workflows::messages.detail_finished')}</dt><dd><time dateTime={attempt.completed_at}>{instantLabel(attempt.completed_at, action.timezone)}</time></dd></> : null}
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
