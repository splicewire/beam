import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Input } from '@schemastud/ui';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import { workflowActionInstants } from './workflowActionTime';
import { notice, say, type Notice } from './message-descriptor';
import { richMessage } from './rich-message';
import { useBeamWorkflowsMessages, type BeamWorkflowsMessageKey } from './messages';

/** Local form output; the host combines this with its selected subject and declared action DTO. */
export interface WorkflowActionSelection {
    transition: string;
    dueAt: string;
    timezone: string;
}

/** A workflow transition scheduled for an explicit instant. Transport and subject selection are injected. */
export function WorkflowActionForm({
    projection, subjectLabel, subjectPicker, initialTransition = '', initialLocalTime = '',
    initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone, onSchedule,
    submitLabel,
}: {
    projection: WorkflowProjectionData | null;
    subjectLabel?: string;
    subjectPicker?: ReactNode;
    initialTransition?: string;
    initialLocalTime?: string;
    initialTimezone?: string;
    onSchedule: (selection: WorkflowActionSelection) => Promise<void>;
    submitLabel?: string;
}) {
    const id = useId();
    const [transition, setTransition] = useState(initialTransition);
    const [localTime, setLocalTime] = useState(initialLocalTime);
    const [timezone, setTimezone] = useState(initialTimezone);
    const [foldInstant, setFoldInstant] = useState('');
    const [pending, setPending] = useState(false);
    const submitting = useRef(false);
    const m = useBeamWorkflowsMessages();
    // A failure is a notice (our catalog line, or the error's own message as it arrived), translated where it renders.
    const [error, setError] = useState<Notice | null>(null);
    const names = [...new Set(projection?.transitions.map((item) => item.name) ?? [])];
    // The memo keeps a catalog KEY, never translated text, so it needs no `m` in its deps.
    const timing = useMemo<{ instants: string[]; error: BeamWorkflowsMessageKey | null }>(() => {
        try { return { instants: workflowActionInstants(localTime, timezone), error: null }; }
        catch { return { instants: [], error: 'splicewire-beam-workflows::messages.action_invalid_timezone' }; }
    }, [localTime, timezone]);
    const dueAt = timing.instants.length === 1 ? timing.instants[0]
        : timing.instants.includes(foldInstant) ? foldInstant : '';
    const timingError: BeamWorkflowsMessageKey | null = timing.error ?? (localTime && timing.instants.length === 0
        ? 'splicewire-beam-workflows::messages.action_missing_local_time' : null);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (submitting.current || !dueAt || !names.includes(transition)) return;
        submitting.current = true;
        setPending(true);
        setError(null);
        try { await onSchedule({ transition, dueAt, timezone }); }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : notice('splicewire-beam-workflows::messages.action_schedule_failed'));
        } finally { submitting.current = false; setPending(false); }
    }

    return (
        <form onSubmit={submit} className="space-y-4" aria-label={m.t('splicewire-beam-workflows::messages.action_form_label')} aria-busy={pending}>
            <fieldset disabled={pending} className="space-y-4">
                {subjectPicker}
                {subjectLabel ? <p className="text-sm font-medium">{subjectLabel}</p> : null}
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-transition`} className="text-sm font-medium">{m.t('splicewire-beam-workflows::messages.action_transition')}</label>
                    <select id={`${id}-transition`} value={transition} required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        onChange={(event) => setTransition(event.target.value)}>
                        <option value="">{m.t('splicewire-beam-workflows::messages.choose_transition')}</option>
                        {names.map((name) => <option key={name} value={name}>{humanizeWorkflowKey(name)}</option>)}
                    </select>
                    {!projection ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.action_no_subject')}</p> : null}
                    {projection && names.length === 0 ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.action_no_transitions')}</p> : null}
                    <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.action_checks_note')}</p>
                    {transition && names.includes(transition) && !projection?.available.includes(transition)
                        ? <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-workflows::messages.action_unavailable_now')}</p> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-time`} className="text-sm font-medium">{m.t('splicewire-beam-workflows::messages.action_date_time')}</label>
                        <Input id={`${id}-time`} type="datetime-local" required value={localTime}
                            aria-describedby={timingError ? `${id}-time-error` : undefined}
                            aria-invalid={Boolean(timingError)}
                            onChange={(event) => { setLocalTime(event.target.value); setFoldInstant(''); }} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-zone`} className="text-sm font-medium">{m.t('splicewire-beam-workflows::messages.timezone')}</label>
                        {/* An IANA zone id, an example value rather than copy. */}
                        <Input id={`${id}-zone`} required value={timezone} placeholder="America/New_York"
                            aria-describedby={timing.error ? `${id}-time-error` : undefined}
                            aria-invalid={Boolean(timing.error)}
                            onChange={(event) => { setTimezone(event.target.value); setFoldInstant(''); }} />
                    </div>
                </div>
                {timingError ? <p id={`${id}-time-error`} role="alert" className="text-sm text-destructive">{m.t(timingError)}</p> : null}
                {timing.instants.length > 1 ? (
                    <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">{m.t('splicewire-beam-workflows::messages.action_ambiguous_time')}</legend>
                        {timing.instants.map((instant) => (
                            <label key={instant} className="flex items-center gap-2 text-sm">
                                <input type="radio" name={`${id}-fold`} value={instant} checked={foldInstant === instant}
                                    onChange={() => setFoldInstant(instant)} />
                                {new Intl.DateTimeFormat(undefined, { timeZone: timezone, dateStyle: 'medium', timeStyle: 'long' }).format(new Date(instant))}
                            </label>
                        ))}
                    </fieldset>
                ) : null}
                {dueAt ? (
                    <p className="text-sm text-muted-foreground">
                        {richMessage(m, 'splicewire-beam-workflows::messages.action_scheduled_instant', { instant: <time dateTime={dueAt}>{dueAt}</time> })}
                    </p>
                ) : null}
                {error ? <p role="alert" className="text-sm text-destructive">{say(m, error)}</p> : null}
                <Button type="submit" disabled={pending || !dueAt || !names.includes(transition)}>
                    {/* A host's submitLabel still wins; the catalog line is the default (no string default in props). */}
                    {pending ? m.t('splicewire-beam-workflows::messages.saving') : (submitLabel ?? m.t('splicewire-beam-workflows::messages.action_submit'))}
                </Button>
            </fieldset>
        </form>
    );
}
