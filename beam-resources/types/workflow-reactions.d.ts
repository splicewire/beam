// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type WorkflowReactionData = {
subject_kind: string,
subject_id: string,
transition: string,
action_kind: string,
action_payload: Record<string, any>,
calendar_days: number,
timezone: string,
calendar_id: string | null,
};

export type WorkflowReactionRecordData = {
id: string,
revision: number,
enabled: boolean,
configuration: WorkflowReactionData,
deliveries: WorkflowReactionDeliveryData[],
};

export type WorkflowReactionDeliveryData = {
id: string,
status: string,
transition_id: string,
action_id: string | null,
anchored_at: string,
attempts: number,
blockers: string[],
};

export type WorkflowReactionListData = {
reactions: WorkflowReactionRecordData[],
};

export type WorkflowReactionSubjectData = {
subject_kind: string,
subject_id: string,
};

export type WorkflowReactionRevisionData = {
id: string,
expected_revision: number,
};

export type WorkflowReactionRetryData = {
id: string,
expected_attempts: number,
};
