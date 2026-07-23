// @splicewire/beam-workflows — the workflows-domain beam surfaces, authored pre-packaged and
// DTO-first (rehome-components; ADR-0092 vendor seam). Mirrors PHP `splicewire/laravel-beam-workflows`.
//
// A host renders the surfaces by supplying ONE transport adapter (+ real-time subscription /
// feedback / chrome) through <WorkflowsProvider>; everything else — the react-query data logic,
// the DTO typing off the generated projection, the presentation — travels inside the package.
//
// Slice 02 lands the DTO-first foundation: the generated Workflow* projection (re-exported off
// @splicewire/_resources), the editable blueprint aliases, and the zero-DOM logic modules. The
// components + provider/client seams arrive in slices 03–05.

// The generated DTO projection (rehome-components 01/08), delivered via @splicewire/_resources.
export type {
    WorkflowLineageData,
    WorkflowVersionData,
    WorkflowBlueprintData,
    WorkflowTransitionData,
    WorkflowCatalogData,
    GuardCatalogEntryData,
    WorkflowCoverageData,
    WorkflowCoverageVersionData,
    WorkflowProjectionData,
    WorkflowTypeOptionData,
    WorkflowBindingData,
    PrincipalKindData,
} from '@splicewire/_resources/types/workflows';

// The editable blueprint shapes (aliases of the DTOs) the editor + logic modules share, plus the
// shared draft normalizer.
export type { GuardCatalogEntry, BlueprintTransition, BlueprintDraft } from './blueprint';
export { toDraft } from './blueprint';

// The injection seams (contract §1, §3): the provider carrying the transport client + feedback.
export { WorkflowsProvider, useWorkflowsServices, useNotify } from './provider';
export type {
    WorkflowsClient,
    WorkflowsServices,
    NotifyEvent,
    BindInput,
    MigrateInput,
} from './types';

// Read-only leaf surfaces (slice 03): consume pure DTOs + the moved logic modules, no transport.
export { WorkflowGraph } from './WorkflowGraph';
export { WorkflowDiff } from './WorkflowDiff';
export { RecipientPicker } from './RecipientPicker';

// Mid-tree surfaces (slice 04): the schema-driven editor (no transport — takes a save callback) and
// the marking-migration wizard (routes through the injected client).
export { WorkflowEditor } from './WorkflowEditor';
export { WorkflowMigrate } from './WorkflowMigrate';

// Pure, DOM-free logic modules (moved byte-for-byte from the app twin).
export { humanizeWorkflowKey } from './humanizeWorkflowKey';

export {
    principalRows,
    tokenKind,
    classifyToken,
    toChips,
    toggleToken,
    type PrincipalOption,
    type PrincipalKind,
    type PrincipalRow,
    type Chip,
} from './principals';

export {
    effectParamsMap,
    effectParamsOf,
    attachEffect,
    detachEffect,
    setEffectParams,
    effectHasParams,
    effectNeedsSetup,
    type ParamBag,
} from './effectParams';

export {
    diffBlueprints,
    isEmptyDiff,
    type PlaceDelta,
    type TransitionDelta,
    type BlueprintDiff,
} from './workflowDelta';

export {
    rankPlaces,
    layoutBlueprint,
    type GraphNode,
    type GraphEdge,
} from './workflowLayout';

export {
    initialPlaceMap,
    mapComplete,
    resolvedMap,
    blockedHeadline,
    type MigrationReport,
    type PlaceMap,
} from './migratePlan';
