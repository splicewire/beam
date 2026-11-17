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
import { notice, say, type Notice } from './message-descriptor';
import { useBeamWorkflowsMessages } from './messages';
import { richMessage } from './rich-message';

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
    const m = useBeamWorkflowsMessages();
    return (
        <section aria-label={m.t('splicewire-beam-workflows::messages.history_label')} className="space-y-4">
            <h3 className="text-base font-semibold">{m.t('splicewire-beam-workflows::messages.history_heading')}</h3>
            {!props.reactions.length ? (
                <p className="text-sm text-muted-foreground">
                    {m.t('splicewire-beam-workflows::messages.history_none')}
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
    const m = useBeamWorkflowsMessages();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<Notice | null>(null);
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
                    : notice('splicewire-beam-workflows::messages.history_update_failed'),
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
        (transition ? humanizeWorkflowKey(transition) : m.t('splicewire-beam-workflows::messages.history_configured_action'));
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
                    {/* The action can be a host-rendered node (describeAction), so the sentence goes through richMessage. */}
                    {richMessage(m, 'splicewire-beam-workflows::messages.history_after', {
                        transition: humanizeWorkflowKey(configuration.transition),
                        action: actionLabel,
                    })}
                </h4>
                <Badge variant="outline">{m.t(reaction.enabled ? 'splicewire-beam-workflows::messages.history_enabled' : 'splicewire-beam-workflows::messages.history_disabled')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
                {/* "calendar days" was never singular: both plural forms keep the English. */}
                {configuration.calendar_days === 0
                    ? m.t('splicewire-beam-workflows::messages.history_on_commit')
                    : m.choice('splicewire-beam-workflows::messages.history_days_later', configuration.calendar_days)}{' '}
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
                    {m.t('splicewire-beam-workflows::messages.history_disable')}
                </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">
                {m.t('splicewire-beam-workflows::messages.history_disable_note')}
            </p>
            {!reaction.deliveries.length ? (
                <p className="text-sm text-muted-foreground">
                    {m.t(reaction.enabled
                        ? 'splicewire-beam-workflows::messages.history_waiting'
                        : 'splicewire-beam-workflows::messages.history_no_deliveries')}
                </p>
            ) : null}
            <ol className="divide-y divide-border">
                {reaction.deliveries.map((delivery) => (
                    <li key={delivery.id} className="space-y-2 py-3 text-sm">
                        <p className="font-medium">
                            {m.t('splicewire-beam-workflows::messages.history_delivery', { status: humanizeWorkflowKey(delivery.status) })}
                        </p>
                        <p>
                            {richMessage(m, 'splicewire-beam-workflows::messages.history_anchored_to', {
                                time: <time dateTime={delivery.anchored_at}>{anchorLabel(delivery.anchored_at)}</time>,
                            })}
                        </p>
                        {delivery.status === 'scheduled' ? (
                            <p className="text-muted-foreground">
                                {m.t('splicewire-beam-workflows::messages.history_scheduled')}
                            </p>
                        ) : null}
                        {delivery.status === 'superseded' ? (
                            <p className="text-muted-foreground">
                                {m.t('splicewire-beam-workflows::messages.history_superseded')}
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
                                {m.t('splicewire-beam-workflows::messages.history_retry_delivery')}
                            </Button>
                        ) : null}
                    </li>
                ))}
            </ol>
            {error ? (
                <p role="alert" className="text-sm text-destructive">
                    {say(m, error)}
                </p>
            ) : null}
        </article>
    );
}
