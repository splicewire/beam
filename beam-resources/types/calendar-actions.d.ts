// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type CalendarActionData = {
kind: string,
payload: Record<string, any>,
due_at: string,
timezone: string,
calendar_id: string | null,
series_id: string | null,
recurrence_id: string | null,
origin: string | null,
correlation_id: string | null,
};

export type CalendarActionRecordData = {
id: string,
revision: number,
status: string,
current_attempt_id: string,
attempt_number: number,
due_at: string,
timezone: string,
kind: string,
payload: Record<string, any>,
principal: string,
creator: string,
origin: string | null,
correlation_id: string | null,
calendar_id: string | null,
series_id: string | null,
recurrence_id: string | null,
attempts: CalendarActionAttemptData[],
};

export type CalendarActionAttemptData = {
id: string,
revision: number,
number: number,
status: string,
blockers: string[],
result: Record<string, any>,
due_at: string,
started_at: string | null,
completed_at: string | null,
};

export type ActionRevisionData = {
expected_revision: number,
};

export type RescheduleActionData = {
expected_revision: number,
action: CalendarActionData,
};

export type RetryActionData = {
expected_revision: number,
due_at: string,
idempotency_key: string,
};
