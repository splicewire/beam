import { Loader2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    cn,
} from '@schemastud/ui';
import type { WorkflowProjectionData } from '@splicewire/_resources/types/workflows';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import { useSubscribe } from './provider';

/**
 * The MODEL-BLIND workflow runtime UI (beam-workflows v2 ticket 07). Extracted from
 * `CompositionEditorPage` so EVERY future WorkflowManaged object gets its lifecycle UI for free — it
 * knows nothing about `Composition`. It is driven entirely by the backend definition projection
 * (`GET .../transitions` → `LifecycleService::projection`): places, transitions, the current
 * marking, and the backend-computed `available` transitions. The UI never hardcodes a graph or a
 * button list.
 *
 * Two pieces, so a host can preserve its own layout:
 *   - `<WorkflowStepperTrack>` — the linear places track (the visual progression);
 *   - `<WorkflowActions>` — the available-driven action buttons, a per-transition confirm/preview
 *     dialog, and the `status.emitted` echo subscription (on a channel-name prop).
 */

/**
 * The definition projection the backend computes — the whole contract this UI renders. Aliased to
 * the generated `App.Data.WorkflowProjectionData` DTO (from `WorkflowProjectionData` + the
 * `typescript:transform` pipeline) so the stepper stays in lockstep with the backend shape.
 */
export type WorkflowProjection = WorkflowProjectionData;

/**
 * The linear places track. Model-blind: it renders whatever `places` it is handed, highlighting
 * `current`. A host may split some places out as standalone badges (e.g. a reversible "pulled-back"
 * state) via `badgePlaces` — those are rendered as a distinct badge instead of a track step.
 */
export function WorkflowStepperTrack({
    places,
    current,
    badgePlaces = [],
    badgeClassName,
    trailing,
}: {
    places: string[];
    current: string;
    badgePlaces?: string[];
    badgeClassName?: string;
    trailing?: ReactNode;
}) {
    // When the current marking is a badge place, show it as a distinct badge, not on the track.
    if (badgePlaces.includes(current)) {
        return (
            <Badge
                variant="outline"
                className={cn(
                    'gap-1.5 font-mono text-[10.5px] tracking-[0.08em] uppercase',
                    badgeClassName ??
                        'border-[var(--beam-amber)]/45 text-[var(--beam-amber)]',
                )}
            >
                <span className="size-1.5 rounded-full bg-[var(--beam-amber)]" />
                {humanizeWorkflowKey(current)}
            </Badge>
        );
    }

    const steps = places.filter((p) => !badgePlaces.includes(p));
    const activeIndex = Math.max(0, steps.indexOf(current));

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5" aria-label={`Lifecycle: ${current}`}>
                {steps.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isPast = index < activeIndex;
                    return (
                        <div key={step} className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'flex items-center gap-1 rounded-[20px] border px-[9px] py-0.5 font-mono text-[10.5px] font-medium tracking-[0.08em] uppercase',
                                    isActive
                                        ? 'border-[var(--beam-green)]/45 text-[var(--beam-green)]'
                                        : isPast
                                          ? 'border-transparent text-[var(--beam-ink-45)]'
                                          : 'border-[var(--beam-ink-15)] text-[var(--beam-ink-35)]',
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        isActive
                                            ? 'bg-[var(--beam-green)]'
                                            : isPast
                                              ? 'bg-[var(--beam-ink-45)]'
                                              : 'bg-[var(--beam-ink-20)]',
                                    )}
                                />
                                {step}
                            </span>
                            {index < steps.length - 1 && (
                                <span className="text-[var(--beam-ink-22)]">→</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {trailing}
        </div>
    );
}

/** Per-transition confirm/preview config. A transition NOT listed here fires immediately. */
export interface TransitionConfirm {
    title: string;
    description?: string;
    /** Overrides the auto-humanised button label. */
    triggerLabel?: string;
    /** Optional preview body (e.g. "exactly what would be published") rendered in the dialog. */
    preview?: ReactNode;
    confirmLabel?: string;
    /** Emphasise the trigger button (e.g. the primary publish action). */
    emphasize?: boolean;
    /** Called when the confirm dialog opens/closes — a host uses it to enable a preview fetch. */
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}

/**
 * The available-driven action buttons + confirm dialog + the `status.emitted` echo subscription.
 * One button per `projection.available` transition — so the buttons ARE the backend's legal moves,
 * never a hardcoded per-status list. Subscribes to the given `channel` and calls `onStatusEmitted`
 * on every push (the poll-loop-ending Display seam).
 */
export function WorkflowActions({
    projection,
    channel,
    onTransition,
    onStatusEmitted,
    pending = false,
    confirm = {},
}: {
    projection: WorkflowProjection | null;
    channel: string;
    onTransition: (name: string) => void;
    onStatusEmitted?: () => void;
    pending?: boolean;
    confirm?: Record<string, TransitionConfirm>;
}) {
    // Live status push (Display seam): refresh on every emitted StatusEvent for THIS subject's
    // channel — a lifecycle change made elsewhere reflects here without a poll loop. The transport
    // is INJECTED (the 4th injection kind): a Laravel host wires Echo, a non-Laravel host wires
    // SSE/WS, a bare host gets the no-op default and simply doesn't auto-refresh.
    const subscribe = useSubscribe();
    const emittedRef = useRef(onStatusEmitted);
    emittedRef.current = onStatusEmitted;
    useEffect(() => {
        if (!channel) return;
        return subscribe(channel, '.status.emitted', () => emittedRef.current?.());
    }, [channel, subscribe]);

    const available = projection?.available ?? [];

    return (
        <>
            {available.map((name) => {
                const cfg = confirm[name];
                return (
                    <Button
                        key={name}
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        className={cn(
                            cfg?.emphasize &&
                                'border-[var(--beam-green)] font-semibold text-[var(--beam-green)] hover:bg-[var(--beam-green)]/10 hover:text-[var(--beam-green)]',
                        )}
                        onClick={() =>
                            cfg?.onOpenChange ? cfg.onOpenChange(true) : onTransition(name)
                        }
                    >
                        {pending && <Loader2 className="animate-spin" />}
                        {cfg?.triggerLabel ?? humanizeWorkflowKey(name)}
                        {cfg && '…'}
                    </Button>
                );
            })}

            {Object.entries(confirm).map(([name, cfg]) =>
                cfg.onOpenChange ? (
                    <Dialog key={name} open={cfg.open ?? false} onOpenChange={cfg.onOpenChange}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{cfg.title}</DialogTitle>
                                {cfg.description && (
                                    <DialogDescription>{cfg.description}</DialogDescription>
                                )}
                            </DialogHeader>
                            {cfg.preview}
                            <DialogFooter>
                                <Button
                                    variant="ghost"
                                    disabled={pending}
                                    onClick={() => cfg.onOpenChange?.(false)}
                                >
                                    Cancel
                                </Button>
                                <Button disabled={pending} onClick={() => onTransition(name)}>
                                    {pending && <Loader2 className="animate-spin" />}
                                    {cfg.confirmLabel ?? cfg.title}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : null,
            )}
        </>
    );
}
