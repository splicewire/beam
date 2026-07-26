// SHARED, NON-SHIPPED story fixtures for the @splicewire/beam-workflows catalog (component-seams
// ticket 26). Deterministic, tiny blueprint/version/catalog/coverage/projection values the stories
// drive the admin surfaces off. NOT part of the package's shipped surface — excluded from `dist`
// (tsup entry is `src/index.ts` only; this file is never imported by it). Kept out of `*.stories.tsx`
// so every story shares one canonical set of workflow shapes.
//
// The blueprint here is a small, cyclic publish workflow (draft → review → published, with a
// revise back-edge) — enough to exercise layering, guards, effects, and a back-edge in the graph,
// while staying small enough that a VR baseline is legible.

import type {
    GuardCatalogEntryData,
    PrincipalKindData,
    WorkflowBlueprintData,
    WorkflowCatalogData,
    WorkflowCoverageData,
    WorkflowLineageData,
    WorkflowProjectionData,
    WorkflowTypeOptionData,
    WorkflowVersionData,
} from '@splicewire/_resources/types/workflows';

/** A small draft→review→published blueprint with a guarded transition + a notify effect. */
export const publishBlueprintV1: WorkflowBlueprintData = {
    name: 'Publish flow',
    places: ['draft', 'in_review', 'published'],
    initial: ['draft'],
    transitions: [
        { name: 'submit', from: ['draft'], to: ['in_review'], guard: null, effects: [], metadata: null },
        {
            name: 'approve',
            from: ['in_review'],
            to: ['published'],
            guard: 'require_review',
            effects: ['notify_owner'],
            metadata: {
                guardParams: { minApprovals: '1' },
                effect_params: { notify_owner: { principals: ['owner:', 'role:Editor'] } },
            },
        },
        { name: 'revise', from: ['in_review'], to: ['draft'], guard: null, effects: [], metadata: null },
    ],
    metadata: null,
};

/** V2 of the same lineage: adds an `archived` place + `archive` transition, drops the guard on approve. */
export const publishBlueprintV2: WorkflowBlueprintData = {
    name: 'Publish flow',
    places: ['draft', 'in_review', 'published', 'archived'],
    initial: ['draft'],
    transitions: [
        { name: 'submit', from: ['draft'], to: ['in_review'], guard: null, effects: [], metadata: null },
        {
            name: 'approve',
            from: ['in_review'],
            to: ['published'],
            guard: null,
            effects: ['notify_owner', 'ping_webhook'],
            metadata: null,
        },
        { name: 'revise', from: ['in_review'], to: ['draft'], guard: null, effects: [], metadata: null },
        { name: 'archive', from: ['published'], to: ['archived'], guard: null, effects: [], metadata: null },
    ],
    metadata: null,
};

/** A single-place trivial blueprint — the "small graph" fixture. */
export const singlePlaceBlueprint: WorkflowBlueprintData = {
    name: 'Trivial',
    places: ['only'],
    initial: ['only'],
    transitions: [],
    metadata: null,
};

/** An empty blueprint — the "new / empty graph" fixture. */
export const emptyBlueprint: WorkflowBlueprintData = {
    name: 'New workflow',
    places: [],
    initial: [],
    transitions: [],
    metadata: null,
};

/** A larger fan-out blueprint (multiple branches, back-edges, an unreached place) — "large graph". */
export const largeBlueprint: WorkflowBlueprintData = {
    name: 'Editorial pipeline',
    places: ['intake', 'triage', 'writing', 'review', 'legal', 'scheduled', 'published', 'spiked'],
    initial: ['intake'],
    transitions: [
        { name: 'accept', from: ['intake'], to: ['triage'], guard: null, effects: [], metadata: null },
        { name: 'assign', from: ['triage'], to: ['writing'], guard: null, effects: [], metadata: null },
        { name: 'reject', from: ['triage'], to: ['spiked'], guard: null, effects: [], metadata: null },
        { name: 'submit', from: ['writing'], to: ['review'], guard: 'require_review', effects: [], metadata: null },
        { name: 'send_legal', from: ['review'], to: ['legal'], guard: null, effects: [], metadata: null },
        { name: 'clear', from: ['legal'], to: ['scheduled'], guard: null, effects: ['ping_webhook'], metadata: null },
        { name: 'schedule', from: ['review'], to: ['scheduled'], guard: null, effects: [], metadata: null },
        { name: 'go_live', from: ['scheduled'], to: ['published'], guard: null, effects: ['notify_owner'], metadata: null },
        { name: 'kick_back', from: ['review'], to: ['writing'], guard: null, effects: [], metadata: null },
    ],
    metadata: null,
};

export const versionsV1V2: WorkflowVersionData[] = [
    { id: 'ver-1', version: 1, isActive: false, blueprint: publishBlueprintV1 },
    { id: 'ver-2', version: 2, isActive: true, blueprint: publishBlueprintV2 },
];

/** Two structurally-identical versions — the "no structural change" diff fixture. */
export const versionsIdentical: WorkflowVersionData[] = [
    { id: 'same-1', version: 1, isActive: false, blueprint: publishBlueprintV1 },
    { id: 'same-2', version: 2, isActive: true, blueprint: publishBlueprintV1 },
];

export const publishLineage: WorkflowLineageData = {
    key: 'publish_flow',
    name: 'Publish flow',
    isSystem: false,
    boundTypes: ['App\\Models\\Post'],
    versions: versionsV1V2,
};

export const systemLineage: WorkflowLineageData = {
    key: 'moderation',
    name: 'Moderation',
    isSystem: true,
    boundTypes: [],
    versions: [{ id: 'mod-1', version: 1, isActive: true, blueprint: singlePlaceBlueprint }],
};

export const lineages: WorkflowLineageData[] = [publishLineage, systemLineage];

export const guards: GuardCatalogEntryData[] = [
    {
        name: 'require_review',
        label: 'Require review',
        paramsSchema: {
            properties: { minApprovals: { type: 'number', title: 'Minimum approvals', default: 1 } },
        },
    },
    { name: 'is_owner', label: 'Is owner', paramsSchema: {} },
];

export const effects: GuardCatalogEntryData[] = [
    {
        name: 'notify_owner',
        label: 'Notify recipients',
        paramsSchema: {
            required: ['principals'],
            properties: { principals: { type: 'array', title: 'Recipients' } },
        },
    },
    {
        name: 'ping_webhook',
        label: 'Ping webhook',
        paramsSchema: {
            required: ['url'],
            properties: { url: { type: 'string', title: 'Webhook URL' } },
        },
    },
];

export const principals: PrincipalKindData[] = [
    { kind: 'owner', label: 'Owner', options: null },
    { kind: 'watcher', label: 'Watchers', options: null },
    {
        kind: 'role',
        label: 'Role',
        options: [
            { value: 'Admin', label: 'Admin' },
            { value: 'Editor', label: 'Editor' },
            { value: 'Author', label: 'Author' },
        ],
    },
];

export const types: WorkflowTypeOptionData[] = [
    { key: 'App\\Models\\Post', label: 'Post' },
    { key: 'App\\Models\\Comment', label: 'Comment' },
    { key: 'schema://acme.test/page', label: 'Page' },
];

export const catalog: WorkflowCatalogData = {
    blueprintSchema: {},
    guards,
    effects,
    types,
    principals,
    canAuthor: true,
};

export const coverage: WorkflowCoverageData = {
    lineageKey: 'publish_flow',
    total: 142,
    versions: [
        { id: 'ver-1', version: 1, isActive: false, count: 12 },
        { id: 'ver-2', version: 2, isActive: true, count: 130 },
    ],
};

export const emptyCoverage: WorkflowCoverageData = {
    lineageKey: 'moderation',
    total: 0,
    versions: [{ id: 'mod-1', version: 1, isActive: true, count: 0 }],
};

export const projection: WorkflowProjectionData = {
    type: 'App\\Models\\Post',
    places: ['draft', 'in_review', 'published', 'archived'],
    transitions: publishBlueprintV2.transitions,
    current: 'in_review',
    available: ['approve', 'revise'],
};
