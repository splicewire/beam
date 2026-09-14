// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type ReadWorkflowHistoryInputData = {
subject_kind: string,
subject_id: string,
limit: number,
before: string | null,
};

export type ReadWorkflowHistoryOutputData = {
facts: WorkflowHistoryFactData[],
next_before: string | null,
};

export type WorkflowHistoryFactData = {
transition_id: string,
transition: string,
from: Record<string, number>,
to: Record<string, number>,
actor: string | null,
run_id: string | null,
causation_id: string | null,
causal_path: string[],
occurred_at: string,
definition_version: string | null,
};
