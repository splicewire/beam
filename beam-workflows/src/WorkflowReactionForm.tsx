import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Input } from '@schemastud/ui';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import type {
    WorkflowReactionData,
    WorkflowReactionSubjectData,
} from '@splicewire/beam-resources/types/workflow-reactions';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import { notice, say, type Notice } from './message-descriptor';
import { useBeamWorkflowsMessages } from './messages';

/** Host-owned destination vocabulary: the workflow package does not construct Circuit requests. */
export type WorkflowReactionDestination = Pick<
    WorkflowReactionData,
    'action_kind' | 'action_payload'
>;

export function WorkflowReactionForm({
    projection,
    subject,
    subjectPicker,
    subjectLabel,
    calendarId = null,
    initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    circuitChoices = [],
    circuitAction,
    onConfigure,
}: {
    projection: WorkflowProjectionData | null;
    subject: WorkflowReactionSubjectData;
    subjectPicker?: ReactNode;
    subjectLabel?: string;
    calendarId?: string | null;
    initialTimezone?: string;
    circuitChoices?: { id: string; label: string }[];
    circuitAction?: (id: string) => WorkflowReactionDestination;
    onConfigure: (input: WorkflowReactionData) => Promise<void>;
}) {
    const id = useId();
    const names = [...new Set(projection?.transitions.map((transition) => transition.name) ?? [])];
    const [source, setSource] = useState(names.includes('publish') ? 'publish' : '');
    const [target, setTarget] = useState(names.includes('unpublish') ? 'unpublish' : '');
    const [destination, setDestination] = useState<'transition' | 'circuit'>('transition');
    const [circuitId, setCircuitId] = useState('');
    const [days, setDays] = useState('30');
    const [timezone, setTimezone] = useState(initialTimezone);
    const [pending, setPending] = useState(false);
    const busy = useRef(false);
    const [error, setError] = useState<Notice | null>(null);
    const m = useBeamWorkflowsMessages();
    let validTimezone = true;
    try {
        new Intl.DateTimeFormat('en', { timeZone: timezone });
    } catch {
        validTimezone = false;
    }
    const calendarDays = destination === 'circuit' ? 0 : Number(days);
    const validDays =
        destination === 'circuit' ||
        (days !== '' &&
            Number.isInteger(calendarDays) &&
            calendarDays >= 0 &&
            calendarDays <= 36500);
    const validDestination =
        destination === 'transition'
            ? names.includes(target)
            : Boolean(circuitAction && circuitChoices.some((choice) => choice.id === circuitId));
    const valid = Boolean(
        subject.subject_id &&
        subject.subject_kind &&
        names.includes(source) &&
        validDestination &&
        validTimezone &&
        validDays,
    );

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (busy.current || !valid) return;
        busy.current = true;
        setPending(true);
        setError(null);
        try {
            const action: WorkflowReactionDestination =
                destination === 'transition'
                    ? {
                          action_kind: 'kind.workflow-transition',
                          action_payload: { ...subject, transition: target },
                      }
                    : circuitAction!(circuitId);
            await onConfigure({
                ...subject,
                transition: source,
                ...action,
                calendar_days: calendarDays,
                timezone,
                calendar_id: calendarId,
            });
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : notice('splicewire-beam-workflows::messages.reaction_save_failed'),
            );
        } finally {
            busy.current = false;
            setPending(false);
        }
    }

    return (
        <form
            aria-label={m.t('splicewire-beam-workflows::messages.reaction_form_label')}
            aria-busy={pending}
            onSubmit={submit}
            className="space-y-4"
        >
            <fieldset disabled={pending} className="space-y-4">
                {subjectPicker}
                {subjectLabel ? <p className="text-sm font-medium">{subjectLabel}</p> : null}
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-source`} className="text-sm font-medium">
                        {m.t('splicewire-beam-workflows::messages.reaction_after_transition')}
                    </label>
                    <select
                        id={`${id}-source`}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                        value={source}
                        onChange={(event) => setSource(event.target.value)}
                    >
                        <option value="">{m.t('splicewire-beam-workflows::messages.choose_transition')}</option>
                        {names.map((name) => (
                            <option key={name} value={name}>
                                {humanizeWorkflowKey(name)}
                            </option>
                        ))}
                    </select>
                    {!projection ? (
                        <p className="text-sm text-muted-foreground">
                            {m.t('splicewire-beam-workflows::messages.reaction_no_subject')}
                        </p>
                    ) : null}
                </div>
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-destination`} className="text-sm font-medium">
                        {m.t('splicewire-beam-workflows::messages.reaction_follow_up_action')}
                    </label>
                    <select
                        id={`${id}-destination`}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={destination}
                        onChange={(event) =>
                            setDestination(
                                event.target.value === 'circuit' ? 'circuit' : 'transition',
                            )
                        }
                    >
                        <option value="transition">{m.t('splicewire-beam-workflows::messages.reaction_destination_transition')}</option>
                        {circuitAction ? <option value="circuit">{m.t('splicewire-beam-workflows::messages.reaction_destination_circuit')}</option> : null}
                    </select>
                </div>
                {destination === 'transition' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label htmlFor={`${id}-target`} className="text-sm font-medium">
                                {m.t('splicewire-beam-workflows::messages.reaction_then_transition')}
                            </label>
                            <select
                                id={`${id}-target`}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                                value={target}
                                onChange={(event) => setTarget(event.target.value)}
                            >
                                <option value="">{m.t('splicewire-beam-workflows::messages.choose_transition')}</option>
                                {names.map((name) => (
                                    <option key={name} value={name}>
                                        {humanizeWorkflowKey(name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor={`${id}-days`} className="text-sm font-medium">
                                {m.t('splicewire-beam-workflows::messages.reaction_days_label')}
                            </label>
                            <Input
                                id={`${id}-days`}
                                type="number"
                                min={0}
                                max={36500}
                                step={1}
                                required
                                value={days}
                                aria-invalid={!validDays}
                                onChange={(event) => setDays(event.target.value)}
                            />
                            {!validDays ? (
                                <p role="alert" className="text-sm text-destructive">
                                    {m.t('splicewire-beam-workflows::messages.reaction_days_invalid')}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-circuit`} className="text-sm font-medium">
                            {m.t('splicewire-beam-workflows::messages.reaction_circuit')}
                        </label>
                        <select
                            id={`${id}-circuit`}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                            value={circuitId}
                            onChange={(event) => setCircuitId(event.target.value)}
                        >
                            <option value="">{m.t('splicewire-beam-workflows::messages.reaction_choose_circuit')}</option>
                            {circuitChoices.map((choice) => (
                                <option key={choice.id} value={choice.id}>
                                    {choice.label}
                                </option>
                            ))}
                        </select>
                        {!circuitChoices.length ? (
                            <p className="text-sm text-muted-foreground">
                                {m.t('splicewire-beam-workflows::messages.reaction_no_circuits')}
                            </p>
                        ) : null}
                    </div>
                )}
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-timezone`} className="text-sm font-medium">
                        {m.t('splicewire-beam-workflows::messages.reaction_timezone')}
                    </label>
                    <Input
                        id={`${id}-timezone`}
                        required
                        value={timezone}
                        aria-invalid={!validTimezone}
                        onChange={(event) => setTimezone(event.target.value)}
                    />
                    {!validTimezone ? (
                        <p role="alert" className="text-sm text-destructive">
                            {m.t('splicewire-beam-workflows::messages.reaction_timezone_invalid')}
                        </p>
                    ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                    {m.t('splicewire-beam-workflows::messages.reaction_timing_note')}
                </p>
                {destination === 'transition' ? (
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-workflows::messages.reaction_calendar_note')}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-workflows::messages.reaction_circuit_note')}
                    </p>
                )}
                {error ? (
                    <p role="alert" className="text-sm text-destructive">
                        {say(m, error)}
                    </p>
                ) : null}
                <Button type="submit" disabled={!valid || pending}>
                    {m.t(pending ? 'splicewire-beam-workflows::messages.saving' : 'splicewire-beam-workflows::messages.reaction_submit')}
                </Button>
            </fieldset>
        </form>
    );
}
