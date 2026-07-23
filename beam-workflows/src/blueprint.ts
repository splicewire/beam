// The editable blueprint shapes, aliased to the generated `Workflow*Data` projection DTOs
// (delivered via @splicewire/_resources). The draft is the same shape edited in local state
// (arrays are mutable in TS), so the editor stays in lockstep with the backend.
//
// These live in their OWN module (not in WorkflowEditor.tsx as the app twin had them) so the
// pure logic modules — effectParams / workflowDelta / workflowLayout — depend on package-local
// types instead of re-coupling to the Editor component. A prefactor so slice 04's WorkflowEditor
// imports these, not the other way around (the app twin's `import … from './WorkflowEditor'`
// would have dragged the whole 581-line component into every logic-module test).
import type {
    GuardCatalogEntryData,
    WorkflowBlueprintData,
    WorkflowTransitionData,
} from '@splicewire/_resources/types/workflows';

export type GuardCatalogEntry = GuardCatalogEntryData;
export type BlueprintTransition = WorkflowTransitionData;
export type BlueprintDraft = WorkflowBlueprintData;
