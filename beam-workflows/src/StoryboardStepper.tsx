import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@schemastud/ui';
import { useBeamWorkflowsMessages } from './messages';

/**
 * A storyboard stepper (owner-review-20261112 ticket 30): one ordered list of steps, shown twice and linked. On the left
 * a compact rail; beside it a storyboard where each step reads as one sentence, opens in place to its body, and is
 * followed by a slot for what it passes on to the next step (the "wire"). Selecting a step in either part selects it in
 * both, and the open state is the same state in both.
 *
 * It knows nothing of workflows or circuits: the host hands it plain steps and needs no provider (the copy is English
 * without the host's message provider). `workflowProjectionToSteps` (./workflowSteps) is the separate adapter that
 * turns a workflow projection into these steps. Linear only; a step is identified by its `key`, never by its position,
 * so nested lanes can be added later without changing what a key means.
 */

/** Where a step stands in the progression. */
export type StoryboardStepStatus = 'done' | 'current' | 'upcoming';

export interface StoryboardStep {
    /** Unique among the steps; selection and open state are keyed by it, not by position. */
    key: string;
    label: string;
    /** The step as one sentence. */
    summary?: ReactNode;
    status: StoryboardStepStatus;
    /** Shown in place when the step is open. */
    body?: ReactNode;
    /** What this step passes on to the next one, shown after it. */
    wire?: ReactNode;
}

export interface StoryboardStepperProps {
    steps: readonly StoryboardStep[];
    /** Controlled selection. Without it the stepper keeps its own, starting at `defaultSelectedKey`, else the current step. */
    selectedKey?: string | null;
    defaultSelectedKey?: string | null;
    onSelectedKeyChange?: (key: string) => void;
    /** Controlled open steps. Without it the stepper keeps its own, starting at `defaultOpenKeys`. */
    openKeys?: readonly string[];
    defaultOpenKeys?: readonly string[];
    onOpenKeysChange?: (keys: string[]) => void;
    /** The accessible name of the whole stepper. */
    label?: string;
    className?: string;
}

const STATUS_KEY = {
    done: 'splicewire-beam-workflows::messages.storyboard_status_done',
    current: 'splicewire-beam-workflows::messages.storyboard_status_current',
    upcoming: 'splicewire-beam-workflows::messages.storyboard_status_upcoming',
} as const;

const dot = (status: StoryboardStepStatus) =>
    cn(
        'size-2 shrink-0 rounded-full',
        status === 'current' ? 'bg-[var(--beam-green)]' : status === 'done' ? 'bg-[var(--beam-ink-45)]' : 'bg-[var(--beam-ink-20)]',
    );

export function StoryboardStepper({
    steps,
    selectedKey,
    defaultSelectedKey,
    onSelectedKeyChange,
    openKeys,
    defaultOpenKeys = [],
    onOpenKeysChange,
    label,
    className,
}: StoryboardStepperProps) {
    const m = useBeamWorkflowsMessages();
    const id = useId();
    const [ownSelected, setOwnSelected] = useState<string | null>(
        () => defaultSelectedKey ?? steps.find((s) => s.status === 'current')?.key ?? steps[0]?.key ?? null,
    );
    const [ownOpen, setOwnOpen] = useState<string[]>(() => [...defaultOpenKeys]);
    const [announced, setAnnounced] = useState('');
    const items = useRef(new Map<string, HTMLLIElement>());

    const selected = selectedKey !== undefined ? selectedKey : ownSelected;
    const open = openKeys ?? ownOpen;

    const select = (key: string) => {
        if (selectedKey === undefined) setOwnSelected(key);
        if (key !== selected) onSelectedKeyChange?.(key);
    };
    const setOpen = (key: string, next: boolean) => {
        if (open.includes(key) === next) return;
        const keys = next ? [...open, key] : open.filter((k) => k !== key);
        if (openKeys === undefined) setOwnOpen(keys);
        onOpenKeysChange?.(keys);
        const step = steps.find((s) => s.key === key);
        if (step) {
            setAnnounced(
                m.t(
                    next
                        ? 'splicewire-beam-workflows::messages.storyboard_step_opened'
                        : 'splicewire-beam-workflows::messages.storyboard_step_closed',
                    { step: step.label },
                ),
            );
        }
    };

    // The rail selects a step and opens it in the storyboard, bringing it into view.
    const fromRail = (key: string) => {
        select(key);
        setOpen(key, true);
        items.current.get(key)?.scrollIntoView?.({ block: 'nearest' });
    };
    // A storyboard sentence selects its step and opens or closes it in place.
    const fromStoryboard = (key: string) => {
        select(key);
        setOpen(key, !open.includes(key));
    };

    const railLabel = m.t('splicewire-beam-workflows::messages.storyboard_rail');

    return (
        <section
            aria-label={label ?? railLabel}
            className={cn('grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]', className)}
        >
            <nav aria-label={railLabel}>
                <ol className="flex flex-col gap-1">
                    {steps.map((step, index) => (
                        <li key={step.key}>
                            <button
                                type="button"
                                aria-current={step.key === selected ? 'step' : undefined}
                                aria-controls={`${id}-step-${index}`}
                                onClick={() => fromRail(step.key)}
                                className={cn(
                                    'flex min-h-8 w-full min-w-6 items-center gap-2 rounded-md px-2 py-1 text-left text-sm',
                                    'focus-visible:ring-2 focus-visible:ring-[var(--beam-green)] focus-visible:outline-none',
                                    step.key === selected
                                        ? 'bg-[var(--beam-ink-15)] font-medium text-[var(--beam-ink)]'
                                        : 'text-[var(--beam-ink-45)] hover:bg-[var(--beam-ink-15)]/50',
                                )}
                            >
                                <span aria-hidden className={dot(step.status)} />
                                <span className="truncate">{step.label}</span>
                                <span className="sr-only">, {m.t(STATUS_KEY[step.status])}</span>
                            </button>
                        </li>
                    ))}
                </ol>
            </nav>

            <ol className="flex min-w-0 flex-col">
                {steps.map((step, index) => {
                    const isOpen = open.includes(step.key);
                    // DOM ids follow the rendered order (a key may hold any characters); state stays keyed.
                    const bodyId = `${id}-body-${index}`;
                    const isLast = index === steps.length - 1;
                    return (
                        <li
                            key={step.key}
                            id={`${id}-step-${index}`}
                            data-selected={step.key === selected || undefined}
                            ref={(el) => {
                                if (el) items.current.set(step.key, el);
                                else items.current.delete(step.key);
                            }}
                            className="flex flex-col"
                        >
                            <div
                                className={cn(
                                    'rounded-md border',
                                    step.key === selected ? 'border-[var(--beam-green)]/45' : 'border-[var(--beam-ink-15)]',
                                )}
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={bodyId}
                                    onClick={() => fromStoryboard(step.key)}
                                    className="flex min-h-8 w-full items-start gap-2 px-3 py-2 text-left focus-visible:ring-2 focus-visible:ring-[var(--beam-green)] focus-visible:outline-none"
                                >
                                    <span aria-hidden className={cn(dot(step.status), 'mt-1.5')} />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-[var(--beam-ink)]">{step.label}</span>
                                        {step.summary != null && (
                                            <span className="block text-sm text-[var(--beam-ink-45)]">{step.summary}</span>
                                        )}
                                    </span>
                                    <span className="sr-only">, {m.t(STATUS_KEY[step.status])}</span>
                                </button>
                                <div
                                    id={bodyId}
                                    role="region"
                                    aria-label={step.label}
                                    hidden={!isOpen}
                                    className="border-t border-[var(--beam-ink-15)] px-3 py-2 text-sm"
                                >
                                    {isOpen && step.body}
                                </div>
                            </div>
                            {step.wire != null ? (
                                <div
                                    aria-label={m.t('splicewire-beam-workflows::messages.storyboard_wire', { step: step.label })}
                                    role="group"
                                    className="ml-4 border-l border-dashed border-[var(--beam-ink-20)] py-2 pl-4 text-xs text-[var(--beam-ink-45)]"
                                >
                                    {step.wire}
                                </div>
                            ) : (
                                !isLast && <div aria-hidden className="ml-4 h-3 border-l border-[var(--beam-ink-15)]" />
                            )}
                        </li>
                    );
                })}
            </ol>

            <p aria-live="polite" className="sr-only">
                {announced}
            </p>
        </section>
    );
}
