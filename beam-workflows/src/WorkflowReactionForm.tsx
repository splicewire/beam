import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Input } from '@schemastud/ui';
import type { WorkflowProjectionData } from '@splicewire/_resources/types/workflows';
import type {
    WorkflowReactionData,
    WorkflowReactionSubjectData,
} from '@splicewire/beam-resources/types/workflow-reactions';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';

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
    const [error, setError] = useState<string | null>(null);
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
                    : 'The follow-up could not be saved. Try again.',
            );
        } finally {
            busy.current = false;
            setPending(false);
        }
    }

    return (
        <form
            aria-label="Configure workflow follow-up"
            aria-busy={pending}
            onSubmit={submit}
            className="space-y-4"
        >
            <fieldset disabled={pending} className="space-y-4">
                {subjectPicker}
                {subjectLabel ? <p className="text-sm font-medium">{subjectLabel}</p> : null}
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-source`} className="text-sm font-medium">
                        After transition
                    </label>
                    <select
                        id={`${id}-source`}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                        value={source}
                        onChange={(event) => setSource(event.target.value)}
                    >
                        <option value="">Choose a transition…</option>
                        {names.map((name) => (
                            <option key={name} value={name}>
                                {humanizeWorkflowKey(name)}
                            </option>
                        ))}
                    </select>
                    {!projection ? (
                        <p className="text-sm text-muted-foreground">
                            Choose a subject with a workflow to configure a follow-up.
                        </p>
                    ) : null}
                </div>
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-destination`} className="text-sm font-medium">
                        Follow-up action
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
                        <option value="transition">Schedule another transition</option>
                        {circuitAction ? <option value="circuit">Run a Circuit</option> : null}
                    </select>
                </div>
                {destination === 'transition' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label htmlFor={`${id}-target`} className="text-sm font-medium">
                                Then transition
                            </label>
                            <select
                                id={`${id}-target`}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                                value={target}
                                onChange={(event) => setTarget(event.target.value)}
                            >
                                <option value="">Choose a transition…</option>
                                {names.map((name) => (
                                    <option key={name} value={name}>
                                        {humanizeWorkflowKey(name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor={`${id}-days`} className="text-sm font-medium">
                                Calendar days later
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
                                    Enter a whole number from 0 to 36500.
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label htmlFor={`${id}-circuit`} className="text-sm font-medium">
                            Circuit
                        </label>
                        <select
                            id={`${id}-circuit`}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                            value={circuitId}
                            onChange={(event) => setCircuitId(event.target.value)}
                        >
                            <option value="">Choose a Circuit…</option>
                            {circuitChoices.map((choice) => (
                                <option key={choice.id} value={choice.id}>
                                    {choice.label}
                                </option>
                            ))}
                        </select>
                        {!circuitChoices.length ? (
                            <p className="text-sm text-muted-foreground">
                                No Circuits are available. Create a Circuit or choose another
                                follow-up action.
                            </p>
                        ) : null}
                    </div>
                )}
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-timezone`} className="text-sm font-medium">
                        Follow-up timezone
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
                            Enter an IANA timezone, such as America/New_York.
                        </p>
                    ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                    Timing starts from the actual successful transition. A delayed or refused
                    transition never creates an early follow-up.
                </p>
                {destination === 'transition' ? (
                    <p className="text-sm text-muted-foreground">
                        Calendar days preserve local time. A missing hour moves forward; a repeated
                        hour uses its first occurrence. A newer matching transition replaces a
                        pending follow-up unless you have manually changed it.
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        The Circuit is requested after the transition commits. Its execution
                        permission and outcome are checked separately.
                    </p>
                )}
                {error ? (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                ) : null}
                <Button type="submit" disabled={!valid || pending}>
                    {pending ? 'Saving…' : 'Add follow-up'}
                </Button>
            </fieldset>
        </form>
    );
}
