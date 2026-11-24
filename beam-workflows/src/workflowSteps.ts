import type { ReactNode } from 'react';
import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import type { StoryboardStep } from './StoryboardStepper';

/**
 * The workflow adapter for `StoryboardStepper` (owner-review-20261112 ticket 30): a workflow projection's places become
 * the stepper's steps, so a workflow-managed record gets the same stepper with no host code. The stepper itself never
 * imports this module.
 *
 * The rule: the projection's marking (`current`) is the current step, the places before it are done, and the rest are
 * upcoming. The generated DTO holds one marked place (`current: string`). A marking outside `places` (a host's badge
 * place, say) leaves no step current and none done.
 */
export interface WorkflowStepsOptions {
    /** The step's label; the humanized place key by default. */
    label?: (place: string) => string;
    summary?: (place: string) => ReactNode;
    body?: (place: string) => ReactNode;
    wire?: (place: string) => ReactNode;
}

export function workflowProjectionToSteps(
    projection: Pick<WorkflowProjectionData, 'places' | 'current'>,
    options: WorkflowStepsOptions = {},
): StoryboardStep[] {
    const at = projection.places.indexOf(projection.current);
    return projection.places.map((place, index) => ({
        key: place,
        label: options.label ? options.label(place) : humanizeWorkflowKey(place),
        summary: options.summary?.(place),
        status: at < 0 || index > at ? 'upcoming' : index === at ? 'current' : 'done',
        body: options.body?.(place),
        wire: options.wire?.(place),
    }));
}
