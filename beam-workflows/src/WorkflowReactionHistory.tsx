import { useRef, useState, type ReactNode } from 'react';
import { Badge, Button } from '@schemastud/ui';
import type {
    WorkflowReactionData,
    WorkflowReactionDeliveryData,
    WorkflowReactionRecordData,
    WorkflowReactionRetryData,
    WorkflowReactionRevisionData,
    WorkflowReactionSubjectData,
} from '@splicewire/beam-resources/types/workflow-reactions';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';

export interface WorkflowReactionHistoryProps {
    reactions: WorkflowReactionRecordData[];
    onDisable?: (input: WorkflowReactionRevisionData) => Promise<void>;
    onRetry?: (input: WorkflowReactionRetryData) => Promise<void>;
    renderActionLink?: (id: string) => ReactNode;
    renderTransitionLink?: (id: string, subject: WorkflowReactionSubjectData) => ReactNode;
    renderDelivery?: (delivery: WorkflowReactionDeliveryData) => ReactNode;
    describeAction?: (configuration: WorkflowReactionData) => ReactNode;
}

/** Configuration and delivery are separate outcomes; scheduled never claims downstream success. */
export function WorkflowReactionHistory(props: WorkflowReactionHistoryProps) {
    return (
        <section aria-label="Workflow follow-up history" className="space-y-4">
            <h3 className="text-base font-semibold">Configured follow-ups</h3>
            {!props.reactions.length ? (
                <p className="text-sm text-muted-foreground">
                    No follow-ups are configured for this subject.
                </p>
            ) : null}
            {props.reactions.map((reaction) => (
                <ReactionHistory key={reaction.id} {...props} reaction={reaction} />
            ))}
        </section>
    );
}

function ReactionHistory({
    reaction,
    onDisable,
    onRetry,
    renderActionLink,
    renderTransitionLink,
    renderDelivery,
    describeAction,
}: WorkflowReactionHistoryProps & { reaction: WorkflowReactionRecordData }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const busy = useRef(false);
    async function run(callback: () => Promise<void>) {
        if (busy.current) return;
        busy.current = true;
        setPending(true);
        setError(null);
        try {
            await callback();
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'The follow-up could not be updated. Refresh and try again.',
            );
        } finally {
            busy.current = false;
            setPending(false);
        }
    }
    const configuration = reaction.configuration;
    const transition =
        typeof configuration.action_payload.transition === 'string'
            ? configuration.action_payload.transition
            : null;
    const actionLabel =
        describeAction?.(configuration) ??
        (transition ? humanizeWorkflowKey(transition) : 'Configured action');
    function anchorLabel(value: string) {
        try {
            return new Intl.DateTimeFormat(undefined, {
                timeZone: configuration.timezone,
                dateStyle: 'medium',
                timeStyle: 'long',
            }).format(new Date(value));
        } catch {
            return value;
        }
    }
    return (
        <article className="space-y-3 rounded-lg border border-border p-4" aria-busy={pending}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">
                    After {humanizeWorkflowKey(configuration.transition)} → {actionLabel}
                </h4>
                <Badge variant="outline">{reaction.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
                {configuration.calendar_days === 0
                    ? 'After the transition commits'
                    : `${configuration.calendar_days} calendar days later`}{' '}
                · {configuration.timezone}
            </p>
            {reaction.enabled && onDisable ? (
                <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                        void run(() =>
                            onDisable({
                                id: reaction.id,
                                expected_revision: reaction.revision,
                            }),
                        )
                    }
                >
                    Disable follow-up
                </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">
                Disabling stops future captures. Existing deliveries and action history remain.
            </p>
            {!reaction.deliveries.length ? (
                <p className="text-sm text-muted-foreground">
                    {reaction.enabled
                        ? 'Waiting for a successful transition.'
                        : 'No deliveries were captured.'}
                </p>
            ) : null}
            <ol className="divide-y divide-border">
                {reaction.deliveries.map((delivery) => (
                    <li key={delivery.id} className="space-y-2 py-3 text-sm">
                        <p className="font-medium">
                            Delivery: {humanizeWorkflowKey(delivery.status)}
                        </p>
                        <p>
                            Anchored to{' '}
                            <time dateTime={delivery.anchored_at}>
                                {anchorLabel(delivery.anchored_at)}
                            </time>
                        </p>
                        {delivery.status === 'scheduled' ? (
                            <p className="text-muted-foreground">
                                The action is scheduled. Open its outcome to inspect execution.
                            </p>
                        ) : null}
                        {delivery.status === 'superseded' ? (
                            <p className="text-muted-foreground">
                                A newer transition replaced this pending follow-up.
                            </p>
                        ) : null}
                        {delivery.blockers.length ? (
                            <ul className="list-disc space-y-1 pl-5">
                                {delivery.blockers.map((blocker, index) => (
                                    <li key={index}>{blocker}</li>
                                ))}
                            </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                            {renderTransitionLink?.(delivery.transition_id, {
                                subject_kind: configuration.subject_kind,
                                subject_id: configuration.subject_id,
                            })}
                            {delivery.action_id ? renderActionLink?.(delivery.action_id) : null}
                        </div>
                        {renderDelivery?.(delivery)}
                        {['blocked', 'failed'].includes(delivery.status) && onRetry ? (
                            <Button
                                disabled={pending}
                                onClick={() =>
                                    void run(() =>
                                        onRetry({
                                            id: delivery.id,
                                            expected_attempts: delivery.attempts,
                                        }),
                                    )
                                }
                            >
                                Retry delivery
                            </Button>
                        ) : null}
                    </li>
                ))}
            </ol>
            {error ? (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </article>
    );
}
