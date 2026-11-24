import { useState, type ReactNode } from 'react';
import { Button } from '@schemastud/ui';
import { CardBoard, type CardBoardLane, type CardBoardProps, type CardMoveResult } from '@schemastud/ui/card-board';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import { useBeamWorkflowsMessages } from './messages';
import { transitionIntoPlace } from './transitionIntoPlace';
import { workflowProjectionToSteps } from './workflowSteps';

/**
 * A workflow board (owner-review-20261112 ticket 47), built on the card board of `@schemastud/ui/card-board`.
 *
 * Without an adapter it is that board with the caller's lanes, cards and `onMove`. With the workflow adapter (the
 * caller passes `getProjection` and `onTransition` instead) the lanes are the workflow's places, through ticket 30's
 * `workflowProjectionToSteps`, and each card sits in its subject's current place. Moving a card applies the one
 * available transition into that place (`transitionIntoPlace`); otherwise the move is refused with the backend's
 * reason and the card goes back. Every card also offers its available transitions as buttons, so nothing needs
 * dragging. The caller owns `cards`: after `onTransition` resolves, the caller's new projection moves the card.
 *
 * Its own subpath (`@splicewire/beam-workflows/workflow-board`), because the card board's drag needs `@dnd-kit/core`,
 * an optional peer, and `@schemastud/ui` at c6b98762 or later.
 */
interface WorkflowBoardCommonProps<S> {
    cards: readonly S[];
    getCardKey: (card: S) => string;
    /** The card's name as plain text, for its controls and announcements. */
    getCardLabel: (card: S) => string;
    renderCard: (card: S) => ReactNode;
    /** The accessible name of the board. */
    label?: string;
    className?: string;
}

/** Without an adapter: the caller's lanes and `onMove`, as on the card board. */
export interface WorkflowBoardPlainProps<S> extends WorkflowBoardCommonProps<S> {
    lanes: readonly CardBoardLane[];
    getCardLane: (card: S) => string;
    onMove: CardBoardProps<S>['onMove'];
    getProjection?: never;
    onTransition?: never;
}

/** With the workflow adapter: lanes and moves come from each subject's workflow projection. */
export interface WorkflowBoardWorkflowProps<S> extends WorkflowBoardCommonProps<S> {
    getProjection: (card: S) => Pick<WorkflowProjectionData, 'places' | 'transitions' | 'current' | 'available'>;
    /** Applies a transition to the subject. A rejection refuses the move, with the error's message as the reason. */
    onTransition: (card: S, transition: string) => void | Promise<void>;
    /** The lanes' places, in order; the first card's projection places by default. */
    places?: readonly string[];
    /** A place's label; the humanized place key by default. */
    placeLabel?: (place: string) => string;
    /** A transition's label; the humanized transition name by default. */
    transitionLabel?: (transition: string) => string;
    lanes?: never;
    getCardLane?: never;
    onMove?: never;
}

export type WorkflowBoardProps<S> = WorkflowBoardPlainProps<S> | WorkflowBoardWorkflowProps<S>;

export function WorkflowBoard<S>(props: WorkflowBoardProps<S>) {
    if (props.getProjection) return <WorkflowAdapterBoard {...props} />;
    const { lanes, cards, getCardKey, getCardLane, getCardLabel, renderCard, onMove, label, className } = props;
    return (
        <CardBoard
            lanes={lanes}
            cards={cards}
            getCardKey={getCardKey}
            getCardLane={getCardLane}
            getCardLabel={getCardLabel}
            renderCard={renderCard}
            onMove={onMove}
            label={label}
            className={className}
        />
    );
}

function WorkflowAdapterBoard<S>({
    cards,
    getCardKey,
    getCardLabel,
    renderCard,
    label,
    className,
    getProjection,
    onTransition,
    places,
    placeLabel = humanizeWorkflowKey,
    transitionLabel = humanizeWorkflowKey,
}: WorkflowBoardWorkflowProps<S>) {
    const m = useBeamWorkflowsMessages();
    const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
    const [failures, setFailures] = useState<ReadonlyMap<string, string>>(new Map());

    const first = cards[0];
    const lanePlaces = places ?? (first === undefined ? [] : getProjection(first).places);
    // Ticket 30's adapter names the places; the board needs only each step's key and label.
    const lanes: CardBoardLane[] = workflowProjectionToSteps({ places: [...lanePlaces], current: '' }, { label: placeLabel }).map(
        (step) => ({ key: step.key, title: step.label, label: step.label }),
    );

    const onMove = async (card: S, toPlace: string): Promise<CardMoveResult> => {
        const move = transitionIntoPlace(getProjection(card), toPlace);
        switch (move.kind) {
            case 'apply':
                await onTransition(card, move.transition);
                return true;
            case 'blocked':
                return { refused: move.reason };
            case 'ambiguous':
                return {
                    refused: m.t('splicewire-beam-workflows::messages.board_choose_one', {
                        transitions: move.transitions.map(transitionLabel).join(', '),
                    }),
                };
            case 'none':
                return { refused: m.t('splicewire-beam-workflows::messages.board_no_transition') };
        }
    };

    const run = async (card: S, transition: string) => {
        const key = getCardKey(card);
        if (busy.has(key)) return;
        setBusy((s) => new Set(s).add(key));
        setFailures((f) => without(f, key));
        try {
            await onTransition(card, transition);
        } catch (error) {
            const reason = error instanceof Error ? error.message : '';
            const name = transitionLabel(transition);
            const said = reason
                ? m.t('splicewire-beam-workflows::messages.board_transition_failed', { transition: name, reason })
                : m.t('splicewire-beam-workflows::messages.board_transition_failed_no_reason', { transition: name });
            setFailures((f) => new Map(f).set(key, said));
        } finally {
            setBusy((s) => {
                const next = new Set(s);
                next.delete(key);
                return next;
            });
        }
    };

    const renderWorkflowCard = (card: S) => {
        const key = getCardKey(card);
        const available = [...new Set(getProjection(card).available)];
        const failure = failures.get(key);
        return (
            <>
                {renderCard(card)}
                {available.length > 0 && (
                    <div
                        role="group"
                        aria-label={m.t('splicewire-beam-workflows::messages.board_transitions', { card: getCardLabel(card) })}
                        className="mt-2 flex flex-wrap gap-1.5"
                    >
                        {available.map((name) => (
                            <Button
                                key={name}
                                type="button"
                                size="sm"
                                variant="outline"
                                aria-disabled={busy.has(key) || undefined}
                                onClick={() => void run(card, name)}
                            >
                                {transitionLabel(name)}
                            </Button>
                        ))}
                    </div>
                )}
                {failure && (
                    <p role="alert" className="mt-1.5 text-xs text-destructive">
                        {failure}
                    </p>
                )}
            </>
        );
    };

    return (
        <CardBoard
            lanes={lanes}
            cards={cards}
            getCardKey={getCardKey}
            getCardLane={(card) => getProjection(card).current}
            getCardLabel={getCardLabel}
            renderCard={renderWorkflowCard}
            onMove={onMove}
            label={label}
            className={className}
        />
    );
}

function without<V>(map: ReadonlyMap<string, V>, key: string): ReadonlyMap<string, V> {
    const next = new Map(map);
    next.delete(key);
    return next;
}
