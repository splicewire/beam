// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type BeamUxEntryBodyData = {
slug: string,
id: string,
type: string,
format: string,
schema: Record<string, any> | null,
body: Record<string, any>,
source: string | null,
compileError: string | null,
profile?: Record<string, any> | null,
styleRegistry?: Array<any> | null,
pageSettings?: EntryPageSettingsData | null,
bindings?: Array<any>,
pageFields?: Record<string, any> | null,
fileLanguages?: string[] | null,
intakeForms?: Record<string, Record<string, any>>,
mediaLibrary?: boolean,
authoredComponents: ComponentCanvasData[],
};

export type EntryVersionData = {
id: string,
version: number,
readable: string,
label: string | null,
createdBy: string | null,
createdAt: string | null,
isHead: boolean,
isPublished: boolean,
recordings?: ReleaseRecordingData[],
};

export type JsonNode = JsonBlockNode & {
kind: 'block',
} | JsonTextNode & {
kind: 'text',
} | JsonOpaqueNode & {
kind: 'opaque',
};

export type JsonBlockNode = {
name: string | null,
isComponent: boolean,
props: JsonProp[],
children: JsonNode[],
dynamic: boolean,
id?: string | null,
kind: 'block',
style?: BlockStyleData | null,
repeat?: RepeatData | null,
when?: ConditionData | null,
slots?: Record<string, JsonNode[]>,
component?: ComponentDefinitionData | null,
};

export type ComponentDefinitionData = {
name: string | null,
props: ComponentPropData[],
};

export type ComponentPropData = {
name: string,
type: ComponentPropType,
required: boolean,
default: string | number | boolean | null,
choices: string[],
};

export type ComponentPropType = 'text' | 'number' | 'toggle' | 'choice' | 'link' | 'image';

export type ComponentCanvasData = {
id: string,
definition: ComponentDefinitionData,
body: JsonNode[],
bindings: Record<string, RepeatRecordsData>,
headVersion: string | null,
publishedVersion: string | null,
};

export type ComponentArtifactData = {
name: string,
url: string | null,
version: string | null,
bindings: Record<string, RepeatRecordsData>,
};

export type RepeatRecordsData = {
records: Record<string, unknown>[],
hasMore: boolean,
page: number,
};

export type RecordPageData = {
collection: string,
field: string,
titleField: string | null,
descriptionField: string | null,
socialImageField: string | null,
};

export type JsonTextNode = {
value: string,
kind: 'text',
field?: string | null,
prop?: string | null,
};

export type JsonOpaqueNode = {
reason: OpaqueReason,
source: string,
kind: 'opaque',
};

export type JsonProp = {
name: string,
kind: PropKind,
value: string | number | boolean | null,
};

export type PropKind = 'boolean-shorthand' | 'string' | 'number' | 'boolean' | 'expression' | 'field' | 'prop';

export type OpaqueReason = 'map' | 'conditional' | 'ternary' | 'expression' | 'spread';

export type CanvasBodyInputData = {
body: JsonNode[],
};

export type EntryPageSettingsData = {
title: string,
parentId: string | null,
segment: string | null,
navOrder: number | null,
navGroup: string | null,
layout: string | null,
template: string | null,
description: string | null,
socialImage: string | null,
pageType: string,
publishedDate: string | null,
fileLanguage: string | null,
childFields: string | null,
fields: Record<string, string | number | boolean>,
unclaimed: Record<string, string>,
recordPage?: RecordPageData | null,
};

export type ReleaseRecordingData = {
releaseId: string,
status: string,
sha: string | null,
noChange: boolean,
canRetry: boolean,
message: string | null,
};

export type BlockStyleData = {
layers: StyleLayerData[],
};

export type StyleLayerData = {
declarations: Record<string, string>,
breakpoint?: string | null,
state?: string | null,
};

export type RepeatData = {
collection?: string | null,
relation?: string | null,
query?: RepeatQueryData | null,
empty?: JsonNode[],
};

export type RepeatQueryData = {
filter?: Record<string, any> | null,
sort?: string | null,
limit?: number,
filterVariant?: string | null,
};

export type ConditionData = {
all?: ConditionRuleData[] | null,
any?: ConditionRuleData[] | null,
};

export type ConditionRuleData = {
field: string,
operator: ConditionOperator,
value?: string | number | boolean | null,
};

export type ConditionOperator = 'is set' | 'is empty' | 'equals' | 'does not equal' | 'greater than' | 'less than' | 'contains';
