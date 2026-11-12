// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type WorkflowLineageData = {
key: string,
name: string,
isSystem: boolean,
boundTypes: string[],
versions: WorkflowVersionData[],
};

export type WorkflowVersionData = {
id: string,
version: number,
isActive: boolean,
blueprint: WorkflowBlueprintData,
};

export type WorkflowBlueprintData = {
name: string,
places: string[],
initial: string[],
transitions: WorkflowTransitionData[],
metadata: Record<string, any> | null,
};

export type WorkflowTransitionData = {
name: string,
from: string[],
to: string[],
guard: string | null,
effects: string[],
metadata: Record<string, any> | null,
reason: string | null,
};

export type WorkflowCatalogData = {
blueprintSchema: Record<string, any>,
guards: GuardCatalogEntryData[],
effects: GuardCatalogEntryData[],
types: WorkflowTypeOptionData[],
principals: PrincipalKindData[],
canAuthor: boolean,
};

export type GuardCatalogEntryData = {
name: string,
label: string,
paramsSchema: Record<string, any>,
};

export type WorkflowCoverageData = {
lineageKey: string,
total: number,
versions: WorkflowCoverageVersionData[],
};

export type WorkflowCoverageVersionData = {
id: string,
version: number,
isActive: boolean,
count: number,
};

export type WorkflowProjectionData = {
type: string,
places: string[],
transitions: WorkflowTransitionData[],
current: string,
available: string[],
};

export type WorkflowTypeOptionData = {
key: string,
label: string,
};

export type WorkflowBindingData = {
typeKey: string,
lineageRef: string,
params: Record<string, any>,
};

export type PrincipalKindData = {
kind: string,
label: string,
options: RoleOptionData[] | null,
};

export type RoleOptionData = {
value: string,
label: string,
};

export type WorkflowTransitionRequestData = {
transition: string,
};

export type WorkflowTransitionAttemptData = {
applied: boolean,
blockers: string[],
projection: WorkflowProjectionData | null,
};
