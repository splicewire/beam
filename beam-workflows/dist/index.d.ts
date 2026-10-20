import { WorkflowBlueprintData, WorkflowTransitionData, GuardCatalogEntryData, WorkflowLineageData, WorkflowCatalogData, WorkflowCoverageData, WorkflowVersionData, WorkflowBindingData, WorkflowProjectionData } from '@splicewire/_resources/types/workflows';
export { GuardCatalogEntryData, PrincipalKindData, WorkflowBindingData, WorkflowBlueprintData, WorkflowCatalogData, WorkflowCoverageData, WorkflowCoverageVersionData, WorkflowLineageData, WorkflowProjectionData, WorkflowTransitionData, WorkflowTypeOptionData, WorkflowVersionData } from '@splicewire/_resources/types/workflows';
import * as react from 'react';
import { ReactNode } from 'react';
import { CalendarActionRecordData } from '@splicewire/beam-resources/types/calendar-actions';
import { WorkflowReactionData, WorkflowReactionSubjectData, WorkflowReactionRecordData, WorkflowReactionRevisionData, WorkflowReactionRetryData, WorkflowReactionDeliveryData } from '@splicewire/beam-resources/types/workflow-reactions';

type GuardCatalogEntry = GuardCatalogEntryData;
type BlueprintTransition = WorkflowTransitionData;
type BlueprintDraft = WorkflowBlueprintData;
/**
 * Normalize a (possibly partial) blueprint into a fully-populated, deeply-cloned editable draft:
 * defaults the initial marking to the first place, clones every array so local edits never mutate
 * the source DTO. Extracted from `WorkflowEditor` (the app twin defined + exported it there) into
 * this shared module — `WorkflowDiff`, `WorkflowMigrate` and `WorkflowsAdminPage` all consume it, so
 * it must not live inside a component that lands in a later slice (another `import type` /value
 * coupling the "zero-coupling" inventory missed).
 */
declare function toDraft(blueprint: Partial<BlueprintDraft> & {
    name: string;
}): BlueprintDraft;

/**
 * Pure planning helpers for the marking-migration wizard (beam-workflows-ux ticket 20, Surface 3). The
 * place-mapping is an explicit, reviewable author choice (a hard UI constraint), so the default map +
 * completeness check live here, unit-tested without a DOM. The wizard wraps the artisan-only
 * `MarkingMigrator` over HTTP — the actual re-pin is all-or-nothing on the server.
 */
/** The server's `MigrationReport` shape (mirrors `MigrationReport::toArray()`). */
type MigrationReport = {
    lineageKey: string;
    fromVersionId: string;
    toVersionId: string;
    total: number;
    migrated: number;
    unmappable: Array<{
        id: string;
        place: string;
    }>;
    applied: boolean;
    dryRun: boolean;
};
type PlaceMap = Record<string, string>;
/**
 * The default old→new place map: each `from`-version place maps to the same-named `to`-version place
 * when one exists, else to '' (an unmapped place the author MUST resolve — a removed/renamed place).
 */
declare function initialPlaceMap(fromPlaces: string[], toPlaces: string[]): PlaceMap;
/** Every `from` place must map to a declared `to` place before a run can be attempted. */
declare function mapComplete(map: PlaceMap): boolean;
/** Drop empty entries so the request only carries resolved mappings. */
declare function resolvedMap(map: PlaceMap): PlaceMap;
/**
 * The all-or-nothing headline (a hard UI constraint — "3 blocked all 142" must read unmistakably). Null
 * when nothing is blocked.
 */
declare function blockedHeadline(report: MigrationReport): string | null;

/** Bind a subject-type key to a lineage (PUT /workflow-bindings). */
interface BindInput {
    typeKey: string;
    lineageRef: string;
    params?: Record<string, unknown>;
}
/** Marking-migration request (POST /workflows/{key}/migrate) — dry-run first, then actuate. */
interface MigrateInput {
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
interface WorkflowsClient<TLineage = WorkflowLineageData, TCatalog = WorkflowCatalogData, TCoverage = WorkflowCoverageData, TVersion = WorkflowVersionData, TBinding = WorkflowBindingData, TProjection = WorkflowProjectionData> {
    /** All lineages with their versions + bound types (GET /workflows). */
    listLineages(): Promise<TLineage[]>;
    /** The blueprint schema + guard/effect/type/principal vocabularies (GET /workflows/catalog). */
    catalog(): Promise<TCatalog>;
    /** Per-version subject counts for a lineage (GET /workflows/{key}/coverage). */
    coverage(key: string): Promise<TCoverage>;
    /**
     * Save a blueprint — forks a new immutable version (POST /workflows/{key}/versions). `activate`
     * (default true) decides whether the new version becomes the lineage's active pointer or is forked
     * inert (fork-only), so an author can stage a draft version without re-pinning new subjects onto it.
     */
    saveVersion(key: string, blueprint: BlueprintDraft, activate?: boolean): Promise<TVersion>;
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
interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}
/**
 * The real-time subscription seam — the 4th injection kind (06's headline delta for 07, alongside
 * transport / feedback / render-slot). Transport-agnostic: a Laravel host wires Laravel Echo, a
 * non-Laravel host wires SSE / WebSocket / a no-op. Subscribe to `event` on `channel`; the returned
 * function unsubscribes (called on unmount / channel change).
 */
type Subscribe = (channel: string, event: string, cb: () => void) => () => void;
/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback, the real-time `subscribe` seam (the 4th injection kind), and host chrome are
 * all optional with dependency-free defaults.
 */
interface WorkflowsServices {
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
    /**
     * The selection channel (admin-redesign ticket 08): the surface emits the currently-selected
     * lineage (or `null` when the selection is cleared) so the host can echo it in its own chrome — a
     * shell status glance ("governing N records"), a breadcrumb third level, a deep-link. The surface
     * remains self-contained (it still renders its own coverage inline); this is a one-way notification,
     * never a control input. Omitted → the surface simply doesn't announce selection.
     */
    onSelectLineage?: (lineage: WorkflowLineageData | null) => void;
}

declare function WorkflowsProvider({ services, children, }: {
    services: WorkflowsServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useWorkflowsServices(): WorkflowsServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useNotify(): (event: NotifyEvent) => void;
/** The injected real-time `subscribe`, or the no-op default when the host wired none. */
declare function useSubscribe(): Subscribe;

/**
 * A READ-ONLY `@xyflow` view of a workflow definition (beam-workflows-ux ticket 18, Surface 1 of the
 * confidence surfaces). Places → nodes, transitions → edges (🔒 guarded, ⚡ has effect), auto-laid-out
 * left-to-right. The schema-form stays the authoring seam — this is a legibility nicety, never an
 * editable canvas (no drag/connect/select affordances).
 *
 * REF-BLIND (ticket 06): it renders only the definition graph — places/transitions/guards/effects —
 * never subject content or the `$ref` graph. Parameterised by a `blueprint`, so the marking-migration
 * wizard (ticket 20) reuses it verbatim as its before/after render.
 */
declare function WorkflowGraph({ blueprint }: {
    blueprint: BlueprintDraft;
}): react.JSX.Element;

type Version$1 = WorkflowVersionData;
/**
 * A read-only structural diff of two workflow DEFINITION versions (beam-workflows-ux ticket 19,
 * Surface 2). Pick a `from` and a `to` from the lineage's versions → places ± and per-transition
 * guard/effect ~. Definition shape only — never record content, never the `$ref` graph (ref-blind,
 * ticket 06). Low blast radius (read-only); the place delta it surfaces is the migration wizard's
 * old→new mapping input (ticket 20).
 */
declare function WorkflowDiff({ versions, lineageKey, }: {
    versions: Version$1[];
    lineageKey: string;
}): react.JSX.Element | null;

/**
 * Pure logic for the recipient-picker widget (beam-workflows-ux tickets 08/17): the declarative
 * `catalog.principals` vocabulary → a FLAT checklist of `kind:selector` tokens, and the classification
 * of a selected token as a known chip vs a flagged "raw" chip. Kept out of the component so the
 * flatten + classify rules are unit-testable without a DOM.
 *
 * The value the picker reads/writes is one array of opaque `kind:selector` strings at
 * `effect_params[<ref>].principals` — exactly what the runtime reads. The picker never sees a user.
 */
type PrincipalOption = {
    value: string;
    label: string;
};
type PrincipalKind = {
    kind: string;
    label: string;
    options?: PrincipalOption[] | null;
};
type PrincipalRow = {
    /** The opaque `kind:selector` token this row toggles (e.g. `owner:`, `role:Admin`). */
    token: string;
    label: string;
    /** `flat` = a fixed kind (owner/watcher); `role` = one instance under the "By role" header. */
    group: 'flat' | 'role';
};
/**
 * Flatten the catalog kinds into a single checklist: a fixed kind (`owner`/`watcher`) → one row whose
 * token is `<kind>:`; a `role` kind → one row per option whose token is `role:<value>` — so a
 * parameterized role never reads as a second widget (ticket 08).
 */
declare function principalRows(kinds: PrincipalKind[]): PrincipalRow[];
type Chip = {
    token: string;
    label: string;
    /** The `kind` prefix, for the chip's small uppercase tag. */
    kind: string;
    /** A known token renders as a normal chip; an undeclared one as a flagged dashed "raw ⚠" chip. */
    known: boolean;
};
/** The `kind` prefix of a `kind:selector` token (`owner:` → `owner`, `role:Admin` → `role`). */
declare function tokenKind(token: string): string;
/** Classify one selected token against the vocabulary — known (in a row) or raw (undeclared). */
declare function classifyToken(token: string, rows: PrincipalRow[]): Chip;
/** Classify a whole selection for chip rendering. */
declare function toChips(tokens: string[], rows: PrincipalRow[]): Chip[];
/** Toggle a token in the selection (add if absent, remove if present) — the checklist semantics. */
declare function toggleToken(tokens: string[], token: string): string[];

/**
 * The recipient picker (beam-workflows-ux tickets 08/17) — the first non-primitive effect param, the
 * field renderer for `workflow.await`'s `principals`. One FLAT checklist (fixed `owner`/`watcher` rows
 * + each role flattened into a sibling row under "By role"), selection shown as removable chips in a
 * `Popover`-triggered, input-shaped field. Plus an "Advanced" raw `kind:selector` escape hatch; an
 * undeclared token renders as a flagged dashed "raw ⚠" chip so fail-silently is made visible.
 *
 * Value = one array of opaque `kind:selector` strings (`effect_params[<ref>].principals`) — exactly
 * what the runtime reads. The picker never resolves a user (co-location).
 */
declare function RecipientPicker({ label, value, onChange, kinds, }: {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    kinds: PrincipalKind[];
}): react.JSX.Element;

declare function WorkflowEditor({ initial, guards, effects, principals, saving, canSave, error, onSave, }: {
    initial: BlueprintDraft;
    guards: GuardCatalogEntry[];
    /** The post-transition effect catalog (notifications, webhooks) — same shape as guards. */
    effects?: GuardCatalogEntry[];
    /** The recipient-picker vocabulary (ticket 17) — `catalog.principals`, for array effect params. */
    principals?: PrincipalKind[];
    saving?: boolean;
    /**
     * Whether the viewer may author (admin-redesign ticket 08). Defaults true; a read-only member
     * (lacks `author-workflows`) gets a disabled Save with a hint — the surface never lets them submit
     * into a server 403. Presentation only: the gate is still enforced server-side on save.
     */
    canSave?: boolean;
    error?: string | null;
    onSave: (blueprint: BlueprintDraft) => void;
}): react.JSX.Element;

type Version = WorkflowVersionData;
/**
 * The marking-migration wizard (beam-workflows-ux ticket 20, Surface 3) — the UI over the artisan-only
 * `MarkingMigrator`, the map's HIGHEST blast radius (a bulk write to live records' workflow state). It
 * foregrounds the two hard constraints: **(a)** all-or-nothing ("N blocked all M" reads unmistakably)
 * and **(b)** each old→new place mapping is an explicit author choice. Flow: pick from/to → map places
 * → dry-run → actuate. Before/after reuse the read-only {@see WorkflowGraph} (ticket 18).
 *
 * FLAT per-type cohort (ticket 06): this migrates only records directly on this workflow — a
 * composition's `$ref`'d children are a separate cohort on a separate lineage, invisible here.
 */
declare function WorkflowMigrate({ versions, lineageKey, }: {
    versions: Version[];
    lineageKey: string;
}): react.JSX.Element | null;

/**
 * The MODEL-BLIND workflow runtime UI (beam-workflows v2 ticket 07). Extracted from
 * `CompositionEditorPage` so EVERY future WorkflowManaged object gets its lifecycle UI for free — it
 * knows nothing about `Composition`. It is driven entirely by the backend definition projection
 * (`GET .../transitions` → `LifecycleService::projection`): places, transitions, the current
 * marking, and the backend-computed `available` transitions. The UI never hardcodes a graph or a
 * button list.
 *
 * Two pieces, so a host can preserve its own layout:
 *   - `<WorkflowStepperTrack>` — the linear places track (the visual progression);
 *   - `<WorkflowActions>` — the available-driven action buttons, a per-transition confirm/preview
 *     dialog, and the `status.emitted` echo subscription (on a channel-name prop).
 */
/**
 * The definition projection the backend computes — the whole contract this UI renders. Aliased to
 * the generated `App.Data.WorkflowProjectionData` DTO (from `WorkflowProjectionData` + the
 * `typescript:transform` pipeline) so the stepper stays in lockstep with the backend shape.
 */
type WorkflowProjection = WorkflowProjectionData;
/**
 * The linear places track. Model-blind: it renders whatever `places` it is handed, highlighting
 * `current`. A host may split some places out as standalone badges (e.g. a reversible "pulled-back"
 * state) via `badgePlaces` — those are rendered as a distinct badge instead of a track step.
 */
declare function WorkflowStepperTrack({ places, current, badgePlaces, badgeClassName, trailing, }: {
    places: string[];
    current: string;
    badgePlaces?: string[];
    badgeClassName?: string;
    trailing?: ReactNode;
}): react.JSX.Element;
/** Per-transition confirm/preview config. A transition NOT listed here fires immediately. */
interface TransitionConfirm {
    title: string;
    description?: string;
    /** Overrides the auto-humanised button label. */
    triggerLabel?: string;
    /** Optional preview body (e.g. "exactly what would be published") rendered in the dialog. */
    preview?: ReactNode;
    confirmLabel?: string;
    /** Emphasise the trigger button (e.g. the primary publish action). */
    emphasize?: boolean;
    /** Called when the confirm dialog opens/closes — a host uses it to enable a preview fetch. */
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}
/**
 * The available-driven action buttons + confirm dialog + the `status.emitted` echo subscription.
 * One button per `projection.available` transition — so the buttons ARE the backend's legal moves,
 * never a hardcoded per-status list. Subscribes to the given `channel` and calls `onStatusEmitted`
 * on every push (the poll-loop-ending Display seam).
 */
declare function WorkflowActions({ projection, channel, onTransition, onStatusEmitted, pending, confirm, }: {
    projection: WorkflowProjection | null;
    channel: string | null | undefined;
    onTransition: (name: string) => void;
    onStatusEmitted?: () => void;
    pending?: boolean;
    confirm?: Record<string, TransitionConfirm>;
}): react.JSX.Element;

declare function WorkflowsAdminPage(): react.JSX.Element;

/**
 * Turn a machine workflow key (`review_gate`, `status.emitted`, `publish-flow`) into a human
 * label (`Review gate`). Extracted from `WorkflowStepper` into its own pure module (slice 02
 * prefactor) so `WorkflowEditor` (slice 04) imports the helper, not the real-time Stepper — the
 * app twin's `import { humanizeWorkflowKey } from './WorkflowStepper'` would have coupled the
 * schema-form editor to the Echo-subscribing Stepper for one string transform.
 */
declare function humanizeWorkflowKey(key: string): string;

/**
 * Pure state helpers for authoring per-effect params (beam-workflows-ux ticket 16). Effects are
 * PLURAL per transition, so their params are keyed under `metadata.effect_params[<ref>]` — exactly the
 * shape the runtime reads (`TransitionBlueprint::effectParams($ref)`) — unlike the singular guard's
 * `metadata.guardParams`. Kept out of the component so the attach/detach/write/needs-setup logic is
 * unit-testable without a DOM.
 */
type ParamBag = Record<string, unknown>;
type EffectParamsMap = Record<string, ParamBag>;
/** The `effect_params` map on a transition (`{}` when absent). */
declare function effectParamsMap(transition: BlueprintTransition): EffectParamsMap;
/** The param bag for one effect ref (`{}` when the effect has none yet). */
declare function effectParamsOf(transition: BlueprintTransition, ref: string): ParamBag;
/** Attach an effect by name (idempotent). No bag is created — it's written lazily on first param edit. */
declare function attachEffect(transition: BlueprintTransition, ref: string): BlueprintTransition;
/** Detach an effect: drop it from `effects` AND delete its whole `effect_params[<ref>]` bag. */
declare function detachEffect(transition: BlueprintTransition, ref: string): BlueprintTransition;
/** Write one effect's param bag under `effect_params[<ref>]`. */
declare function setEffectParams(transition: BlueprintTransition, ref: string, params: ParamBag): BlueprintTransition;
/** Whether an effect declares any authorable params (else the row is toggle-only — no chevron). */
declare function effectHasParams(effect: GuardCatalogEntry): boolean;
/**
 * The "needs setup" flag: an ON effect whose schema-`required` param is still empty. Booleans (which
 * default to `false`) never read as empty; a string/number is empty when unset/blank.
 */
declare function effectNeedsSetup(effect: GuardCatalogEntry, params: ParamBag): boolean;

/**
 * Pure structural diff of two workflow DEFINITION versions (beam-workflows-ux ticket 19, Surface 2 of
 * the confidence surfaces). Diffs definition shape only — places, transitions, per-transition guards
 * and effects — NEVER record content (that's the separate `record-versioning` effort) and never the
 * `$ref` graph (ref-blind, ticket 06).
 *
 * The `places` delta it computes is the reusable input to the marking-migration wizard's old→new
 * mapping (ticket 20): a removed place is one whose records must be re-mapped; an added place is a
 * candidate target.
 */
type PlaceDelta = {
    added: string[];
    removed: string[];
};
type TransitionDelta = {
    /** Stable identity: name + route, so a guard/effect-only edit matches (a route edit reads as ±). */
    key: string;
    name: string;
    from: string[];
    to: string[];
    status: 'added' | 'removed' | 'changed';
    /** Present on `changed` when the guard ref moved. */
    guard?: {
        from: string | null;
        to: string | null;
    };
    /** Present on `changed` when the attached effect set moved. */
    effects?: {
        added: string[];
        removed: string[];
    };
};
type BlueprintDiff = {
    places: PlaceDelta;
    transitions: TransitionDelta[];
};
declare function diffBlueprints(from: BlueprintDraft, to: BlueprintDraft): BlueprintDiff;
/** Whether a diff has anything to show (else the two versions are structurally identical). */
declare function isEmptyDiff(diff: BlueprintDiff): boolean;

/**
 * Pure layout for the read-only workflow graph preview (beam-workflows-ux ticket 18): turn a blueprint
 * (places + transitions) into positioned `@xyflow` nodes/edges. Kept out of the component so the
 * layering + glyph logic is unit-testable without a DOM, and so the graph stays REF-BLIND (ticket 06):
 * it renders only the definition graph — never subject content or the `$ref` graph.
 *
 * Layout is a simple left-to-right LAYERING: BFS distance from the initial place(s) gives each place a
 * rank (column); places in a rank stack vertically. Back-edges (e.g. `revise` → draft) just render as
 * edges pointing left — no special handling, which is correct for the small cyclic graphs workflows are.
 */
type GraphNode = {
    id: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        initial: boolean;
    };
};
type GraphEdge = {
    id: string;
    source: string;
    target: string;
    label: string;
    guarded: boolean;
    hasEffect: boolean;
};
/**
 * Rank every place by BFS distance from the initial marking. Unreachable places are pushed into a
 * trailing column so they still render (a disconnected/typo place stays visible, not dropped).
 */
declare function rankPlaces(blueprint: BlueprintDraft): Map<string, number>;
/**
 * Position places into layered nodes and map transitions to labelled, glyphed edges (one per
 * `from`×`to` pair, so workflow-net markings render intact).
 */
declare function layoutBlueprint(blueprint: BlueprintDraft): {
    nodes: GraphNode[];
    edges: GraphEdge[];
};

/** Local form output; the host combines this with its selected subject and declared action DTO. */
interface WorkflowActionSelection {
    transition: string;
    dueAt: string;
    timezone: string;
}
/** A workflow transition scheduled for an explicit instant. Transport and subject selection are injected. */
declare function WorkflowActionForm({ projection, subjectLabel, subjectPicker, initialTransition, initialLocalTime, initialTimezone, onSchedule, submitLabel, }: {
    projection: WorkflowProjectionData | null;
    subjectLabel?: string;
    subjectPicker?: ReactNode;
    initialTransition?: string;
    initialLocalTime?: string;
    initialTimezone?: string;
    onSchedule: (selection: WorkflowActionSelection) => Promise<void>;
    submitLabel?: string;
}): react.JSX.Element;

/**
 * Resolve a minute-precision wall time without assuming the browser's timezone. Return zero
 * instants for a gap/invalid date and both instants for a fold; the form never chooses a fold
 * implicitly. Invalid IANA identifiers throw RangeError for the field-level error boundary.
 */
declare function workflowActionInstants(local: string, timezone: string): string[];

/** The committed action and its immutable attempt history; host callbacks carry authorization and transport. */
declare function WorkflowActionDetail({ action, subject, onCancel, onRetry, onEdit, renderResult }: {
    action: CalendarActionRecordData;
    subject?: ReactNode;
    onCancel?: () => Promise<void>;
    onRetry?: () => Promise<void>;
    onEdit?: () => void;
    renderResult?: (result: CalendarActionRecordData['attempts'][number]['result']) => ReactNode;
}): react.JSX.Element;

/** Host-owned destination vocabulary: the workflow package does not construct Circuit requests. */
type WorkflowReactionDestination = Pick<WorkflowReactionData, 'action_kind' | 'action_payload'>;
declare function WorkflowReactionForm({ projection, subject, subjectPicker, subjectLabel, calendarId, initialTimezone, circuitChoices, circuitAction, onConfigure, }: {
    projection: WorkflowProjectionData | null;
    subject: WorkflowReactionSubjectData;
    subjectPicker?: ReactNode;
    subjectLabel?: string;
    calendarId?: string | null;
    initialTimezone?: string;
    circuitChoices?: {
        id: string;
        label: string;
    }[];
    circuitAction?: (id: string) => WorkflowReactionDestination;
    onConfigure: (input: WorkflowReactionData) => Promise<void>;
}): react.JSX.Element;

interface WorkflowReactionHistoryProps {
    reactions: WorkflowReactionRecordData[];
    onDisable?: (input: WorkflowReactionRevisionData) => Promise<void>;
    onRetry?: (input: WorkflowReactionRetryData) => Promise<void>;
    renderActionLink?: (id: string) => ReactNode;
    renderTransitionLink?: (id: string, subject: WorkflowReactionSubjectData) => ReactNode;
    renderDelivery?: (delivery: WorkflowReactionDeliveryData) => ReactNode;
    describeAction?: (configuration: WorkflowReactionData) => ReactNode;
}
/** Configuration and delivery are separate outcomes; scheduled never claims downstream success. */
declare function WorkflowReactionHistory(props: WorkflowReactionHistoryProps): react.JSX.Element;

export { type BindInput, type BlueprintDiff, type BlueprintDraft, type BlueprintTransition, type Chip, type GraphEdge, type GraphNode, type GuardCatalogEntry, type MigrateInput, type MigrationReport, type NotifyEvent, type ParamBag, type PlaceDelta, type PlaceMap, type PrincipalKind, type PrincipalOption, type PrincipalRow, RecipientPicker, type Subscribe, type TransitionConfirm, type TransitionDelta, WorkflowActionDetail, WorkflowActionForm, type WorkflowActionSelection, WorkflowActions, WorkflowDiff, WorkflowEditor, WorkflowGraph, WorkflowMigrate, type WorkflowProjection, type WorkflowReactionDestination, WorkflowReactionForm, WorkflowReactionHistory, type WorkflowReactionHistoryProps, WorkflowStepperTrack, WorkflowsAdminPage, type WorkflowsClient, WorkflowsProvider, type WorkflowsServices, attachEffect, blockedHeadline, classifyToken, detachEffect, diffBlueprints, effectHasParams, effectNeedsSetup, effectParamsMap, effectParamsOf, humanizeWorkflowKey, initialPlaceMap, isEmptyDiff, layoutBlueprint, mapComplete, principalRows, rankPlaces, resolvedMap, setEffectParams, toChips, toDraft, toggleToken, tokenKind, useNotify, useSubscribe, useWorkflowsServices, workflowActionInstants };
