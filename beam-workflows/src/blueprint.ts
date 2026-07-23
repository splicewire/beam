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

/**
 * Normalize a (possibly partial) blueprint into a fully-populated, deeply-cloned editable draft:
 * defaults the initial marking to the first place, clones every array so local edits never mutate
 * the source DTO. Extracted from `WorkflowEditor` (the app twin defined + exported it there) into
 * this shared module — `WorkflowDiff`, `WorkflowMigrate` and `WorkflowsAdminPage` all consume it, so
 * it must not live inside a component that lands in a later slice (another `import type` /value
 * coupling the "zero-coupling" inventory missed).
 */
export function toDraft(blueprint: Partial<BlueprintDraft> & { name: string }): BlueprintDraft {
    return {
        name: blueprint.name,
        places: [...(blueprint.places ?? [])],
        initial: [...(blueprint.initial ?? (blueprint.places?.[0] ? [blueprint.places[0]] : []))],
        transitions: (blueprint.transitions ?? []).map((t) => ({
            name: t.name,
            from: [...t.from],
            to: [...t.to],
            guard: t.guard ?? null,
            effects: [...(t.effects ?? [])],
            metadata: t.metadata ?? null,
        })),
        metadata: blueprint.metadata ?? null,
    };
}
