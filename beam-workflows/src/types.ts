import type { ReactNode } from 'react';
// The generated DTO projection (rehome-components 01/08), sliced off the app's single
// `generated.d.ts` and delivered as a bundle. This build-time dependency is LOAD-BEARING
// (contract §2) — the components' default typing IS the projection, so the PHP source of truth
// genuinely travels into this package. tsup keeps the `import type` in the shipped `dist/index.d.ts`.
import type {
    WorkflowLineageData,
    WorkflowCatalogData,
    WorkflowCoverageData,
    WorkflowVersionData,
    WorkflowBindingData,
    WorkflowProjectionData,
} from '@splicewire/_resources/types/workflows';
import type { BlueprintDraft } from './blueprint';
import type { MigrationReport, PlaceMap } from './migratePlan';

export type {
    WorkflowLineageData,
    WorkflowCatalogData,
    WorkflowCoverageData,
    WorkflowVersionData,
    WorkflowBindingData,
    WorkflowProjectionData,
};

/** Bind a subject-type key to a lineage (PUT /workflow-bindings). */
export interface BindInput {
    typeKey: string;
    lineageRef: string;
    params?: Record<string, unknown>;
}

/** Marking-migration request (POST /workflows/{key}/migrate) — dry-run first, then actuate. */
export interface MigrateInput {
    from: string;
    to: string;
    map: PlaceMap;
    dryRun: boolean;
}

/**
 * The injected transport adapter — the ONE data seam a host must implement (contract §1). It wraps
 * whatever transport the host already has (axios, fetch, a server action) and points it at the
 * correct tenant; the components are tenant-blind (contract §7). Generic over the read-model DTOs
 * with defaults bound to the generated projection: DTO-first with zero host effort by default, while
 * a non-Laravel host with divergent shapes can bind its own.
 */
export interface WorkflowsClient<
    TLineage = WorkflowLineageData,
    TCatalog = WorkflowCatalogData,
    TCoverage = WorkflowCoverageData,
    TVersion = WorkflowVersionData,
    TBinding = WorkflowBindingData,
    TProjection = WorkflowProjectionData,
> {
    /** All lineages with their versions + bound types (GET /workflows). */
    listLineages(): Promise<TLineage[]>;
    /** The blueprint schema + guard/effect/type/principal vocabularies (GET /workflows/catalog). */
    catalog(): Promise<TCatalog>;
    /** Per-version subject counts for a lineage (GET /workflows/{key}/coverage). */
    coverage(key: string): Promise<TCoverage>;
    /** Save a blueprint — forks a new immutable version (POST /workflows/{key}/versions). */
    saveVersion(key: string, blueprint: BlueprintDraft): Promise<TVersion>;
    /** Bind a subject-type to a lineage (PUT /workflow-bindings). */
    bind(input: BindInput): Promise<TBinding>;
    /** Unbind a subject-type (DELETE /workflow-bindings). */
    unbind(typeKey: string): Promise<void>;
    /** Re-pin markings from one version to another (POST /workflows/{key}/migrate). */
    migrate(key: string, input: MigrateInput): Promise<MigrationReport>;
    /** Runtime projection for a subject (GET /workflow-subjects/{kind}/{id}/transitions). */
    projection(kind: string, id: string): Promise<TProjection | null>;
    /** Apply a transition, returning the fresh projection (POST /workflow-subjects/{kind}/{id}/transition). */
    transition(kind: string, id: string, name: string): Promise<TProjection>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * The real-time subscription seam — the 4th injection kind (06's headline delta for 07, alongside
 * transport / feedback / render-slot). Transport-agnostic: a Laravel host wires Laravel Echo, a
 * non-Laravel host wires SSE / WebSocket / a no-op. Subscribe to `event` on `channel`; the returned
 * function unsubscribes (called on unmount / channel change).
 */
export type Subscribe = (channel: string, event: string, cb: () => void) => () => void;

/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback and host chrome are optional with dependency-free defaults. The real-time
 * `subscribe` seam (the 4th injection kind) is added in slice 05.
 */
export interface WorkflowsServices {
    client: WorkflowsClient;
    /** Feedback sink; a dependency-free console default applies when omitted (no bundled toaster). */
    notify?: (event: NotifyEvent) => void;
    /** Mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * Real-time subscription (the 4th injection kind). Omitted → a no-op default, so a host with no
     * live transport still mounts (the Stepper just won't auto-refresh on a push).
     */
    subscribe?: Subscribe;
    /**
     * Optional host chrome slotted beside a lineage's header — e.g. a bindings/coverage popover the
     * host owns. The component makes the slot; the host injects the affordance.
     */
    renderLineageChrome?: (lineage: WorkflowLineageData) => ReactNode;
}
