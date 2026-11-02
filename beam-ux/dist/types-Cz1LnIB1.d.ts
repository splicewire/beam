import * as react from 'react';
import { WorkflowProjectionData } from '@splicewire/beam-workflows/action-form';
import * as _splicewire_beam_resources_types_beam_ux from '@splicewire/beam-resources/types/beam-ux';
import { BeamUxEntryBodyData, EntryVersionData } from '@splicewire/beam-resources/types/beam-ux';
import { J as JsonDoc } from './json-CZHn4jKS.js';

/** Projections of the PHP FileInspection/Input/Result Data contracts. */
interface FileInspection {
    memberId: string;
    entryId: string;
    state: string;
    message: string;
    workingHeadVersion: string | null;
    publishedVersion: string | null;
    fileExists: boolean;
    fileSha256: string | null;
    fingerprint: string | null;
    path: string | null;
    publishedSource: string | null;
    localSource: string | null;
    canTake: boolean;
    canRestore: boolean;
    sourceTruncated: boolean;
    format?: string | null;
    canRemirror?: boolean;
    canTakeAll?: boolean;
    takeAllItems?: FileBatchReconcilePreviewItem[];
}
interface FileBatchReconcileItem {
    memberId: string;
    expectedHeadVersion: string;
    expectedPublishedVersion: string;
    expectedFileExists: boolean;
    expectedFileSha256: string | null;
    fingerprint: string;
}
interface FileBatchReconcilePreviewItem extends FileBatchReconcileItem {
    path: string;
}
interface FileBatchReconcileInput {
    items: FileBatchReconcileItem[];
    confirmed: boolean;
}
interface FileBatchReconcileResult {
    count: number;
    entries: FileReconcileResult[];
}
interface FileReconcileInput {
    expectedHeadVersion: string;
    expectedPublishedVersion: string;
    expectedFileExists: boolean;
    expectedFileSha256: string | null;
    fingerprint: string;
    confirmed: boolean;
}
interface FileReconcileResult {
    status: string;
    message: string;
    entryId: string;
    headVersion: string | null;
    publishedVersion: string | null;
    diagnostic?: FileDraftDiagnostic | null;
}
/** Response-only projection of the package-owned safe diagnostic Data. No raw compiler output. */
interface FileDraftDiagnostic {
    code: 'compile-failed';
    message: string;
}

interface ReleaseRecording {
    releaseId: string;
    status: string;
    sha: string | null;
    noChange: boolean;
    canRetry: boolean;
    message: string | null;
}
/** Wire projection of the package-owned PHP ReleaseData / ReleaseCommandData. */
interface ReleaseRecord {
    id: string;
    title: string;
    realm: string;
    status: string;
    reviewedBy: string | null;
    members: Array<{
        entryId: string;
        versionId: string | null;
        observedPin: string | null;
        redirectTarget: string | null;
        stale: boolean;
    }>;
    workflow: WorkflowProjectionData | null;
    canSchedule: boolean;
    reviewRequired: boolean;
    recording?: ReleaseRecording | null;
    filesMemberId?: string | null;
    filesHref?: string | null;
    /** ADR-0232 d8: whether the Release's Preview Links are on, and a link minted for this read (managers only). */
    previewLinksEnabled?: boolean;
    previewLink?: string | null;
    /** ADR-0232 d15: where a signed-in author opens this Release's Preview; null with nothing saved to render. */
    previewHref?: string | null;
    /** Whether this reader may turn the links on or off and rotate them: edit on every member, as the actions check. */
    canManagePreviewLinks?: boolean;
    /**
     * ux-0236 d2: the Redirects the Release leaves: while open, the ones it would leave (no id yet); once published, the
     * ones it left, each with its id.
     */
    redirects?: ReleaseRedirect[];
}
/** A Redirect a Release leaves (ux-0236 d2); `to` is null where it leads nowhere a page answers now. */
interface ReleaseRedirect {
    id: string | null;
    path: string;
    match: string;
    to: string | null;
    origin: string;
}
interface ReleaseCommand {
    action: "member" | "drop" | "rebase" | "use-latest" | "submit" | "approve" | "publish" | "schedule" | "rollback" | "links-on" | "links-off" | "rotate-links";
    entryId?: string;
    ref?: string | null;
    redirectTarget?: string | null;
    dueAt?: string;
    timezone?: string;
}
interface ReleaseEntryChoice {
    id: string;
    title: string;
    versions: Array<{
        id: string;
        label: string;
    }>;
    canTakeDown?: boolean;
}
/** Transport is injected; workflow states, version choices and stale-pin facts come from the server. */
declare function ReleasePanel({ release, entries, initialEntryId, onCommand, onRemoveRedirect, onPreviewOpen, }: {
    release: ReleaseRecord;
    entries: ReleaseEntryChoice[];
    initialEntryId?: string;
    onCommand: (command: ReleaseCommand) => Promise<unknown>;
    /** Tenant SPA handoff: exchanges its bearer session for a short-lived signed Site Host opener. */
    onPreviewOpen?: () => Promise<string>;
    /** Removes a Redirect the Release left, through the Redirect resource; absent, none is offered. */
    onRemoveRedirect?: (id: string) => Promise<unknown>;
}): react.JSX.Element;

interface EntryImageData {
    id: string;
    name: string;
    url: string;
}
interface EntryImageLibraryData {
    items: EntryImageData[];
}

interface RecordPageData {
    collection: string;
    field: string;
    titleField: string | null;
    descriptionField: string | null;
    socialImageField: string | null;
}
interface EntryPageSettings {
    title: string;
    parentId: string | null;
    segment: string | null;
    navOrder: number | null;
    navGroup: string | null;
    layout: string | null;
    template: string | null;
    description: string | null;
    socialImage: string | null;
    pageType: string;
    publishedDate: string | null;
    fileLanguage: string | null;
    childFields: string | null;
    fields: Record<string, string | number | boolean>;
    unclaimed: Record<string, string>;
    recordPage?: RecordPageData | null;
}

type SessionPageSettings = Partial<EntryPageSettings>;

type EntryBody = Record<string, unknown> | JsonDoc;
/**
 * The injected transport adapter — the ONE data seam a host must implement. It wraps whatever
 * transport the host already has (axios, fetch, a server action) and points it at the correct
 * tenant; the components are tenant-blind. Generic over the entry-body DTO with a default bound to
 * the generated projection: DTO-first with zero host effort by default, while a non-Laravel host
 * with a divergent shape can bind its own.
 */
interface UxBuilderClient<TBody = BeamUxEntryBodyData> {
    /**
     * Load the schema + body for an editable region's canonical record, addressed by the entry's
     * **id** (`GET .../beam-ux-entries/{id}/op/body`).
     *
     * It used to take a `slug` plus an optional `namespace` to disambiguate one. Both are gone:
     * ADR-0214 §2 moved the transport onto the particle pipeline's own `{id}` addressing, where the
     * ambiguity the `namespace` argument mitigated (a `theme`-namespaced override and a null-namespace
     * page sharing one slug, an ambiguous `first()` silently serving the WRONG entry) is not
     * representable rather than merely guarded against.
     */
    loadBody(id: string): Promise<TBody>;
    /** Addressed author-only POST read; absent hosts explicitly cannot preview live bindings. */
    canvasBindings?(id: string, body: JsonDoc, recordValue?: string | null, options?: {
        signal?: AbortSignal;
    }): Promise<_splicewire_beam_resources_types_beam_ux.EntryCanvasBindingsOutputData>;
    componentCapabilities?(id: string): Promise<_splicewire_beam_resources_types_beam_ux.EntryComponentCapabilitiesOutputData>;
    createComponent?(contextId: string, input: _splicewire_beam_resources_types_beam_ux.EntryComponentCreateInputData): Promise<_splicewire_beam_resources_types_beam_ux.EntryComponentCreateOutputData>;
    duplicateComponent?(id: string): Promise<_splicewire_beam_resources_types_beam_ux.EntryComponentDuplicateOutputData>;
    listImages?(id: string): Promise<EntryImageLibraryData>;
    uploadImage?(id: string, file: File): Promise<EntryImageData>;
    printSource?(id: string, body: JsonDoc): Promise<{
        source: string;
    }>;
    readSource?(id: string, source: string, body: JsonDoc): Promise<{
        body: JsonDoc;
    }>;
    /** Create an absent page from its default tree; PHP EntryMakeEditableOp, under ux.author. */
    makeEditable?(slug: string, body: Record<string, unknown>): Promise<{
        id: string;
        compileError?: string | null;
    }>;
    /**
     * Persist a region's body — returns the fresh projection
     * (`POST .../beam-ux-entries/{id}/op/save-body`). Addressed by id, same as {@link loadBody}.
     */
    saveBody(id: string, body: EntryBody): Promise<TBody>;
    /**
     * Blocks-only typed write (`save-blocks`). Absent on legacy injected hosts. The canvas editor does not call it: it
     * saves through the publication seam's drafts.
     */
    saveBlocks?(id: string, body: JsonDoc): Promise<TBody>;
    /** Record a body as a DRAFT: written and versioned, NOT published — readers keep the published body. */
    saveDraft?(id: string, body: EntryBody, baseVersion: string | null, label?: string, pageSettings?: SessionPageSettings | null): Promise<EntryPublicationState>;
    /** Publish the working copy: move the publication pin, mirror to disk, compile the artifact. */
    publish?(id: string, ref: string, label?: string): Promise<EntryPublicationState>;
    /** The recorded version history plus both pins. */
    listReleases?(): Promise<ReleaseRecord[]>;
    releaseCommand?(releaseId: string, command: ReleaseCommand): Promise<ReleaseRecord>;
    /** Remove a Redirect a Release left, through the Redirect resource (ux-0236 d2). */
    removeRedirect?(id: string): Promise<void>;
    listVersions?(id: string): Promise<EntryPublicationState>;
    /** Mint an author-only, version-scoped preview URL for a saved entry version. */
    previewVersion?(id: string, versionId: string): Promise<{
        url: string;
    }>;
    inspectReleaseFile?(memberId: string): Promise<FileInspection>;
    takeReleaseFile?(memberId: string, input: FileReconcileInput): Promise<FileReconcileResult>;
    restoreMissingReleaseFile?(memberId: string, input: FileReconcileInput): Promise<FileReconcileResult>;
    remirrorReleaseFile?(memberId: string, input: FileReconcileInput): Promise<FileReconcileResult>;
    takeAllReleaseFiles?(memberId: string, input: FileBatchReconcileInput): Promise<FileBatchReconcileResult>;
    recordReleaseFile?(memberId: string, releaseId: string): Promise<ReleaseRecording>;
    /** Roll forward to a recorded version (a uuid or a readable handle like `v2`) and publish it. */
    restoreVersion?(id: string, ref: string, label?: string): Promise<EntryPublicationState>;
    /**
     * REMOVE the entry's content and return it to the unauthored state
     * (`POST .../beam-ux-entries/{id}/clear-body`): the stored body, its mirror file and its compiled
     * artifact are deleted; the removed body stays in the version history. Optional — a host mounts it
     * deliberately, and it declares the publish gate (`ux.author`). Distinct from saving `[]`, which
     * is an authored empty body.
     */
    clearBody?(id: string, label?: string): Promise<EntryPublicationState>;
    createRelease?(entryId: string, title: string): Promise<ReleaseRecord>;
}
/**
 * An entry's publication state — the projection of
 * `Splicewire\Beam\Ux\Data\EntryPublicationData`, and the ONE shape all four publication operations
 * return, so a surface re-seeds its whole affordance from whatever the server actually did.
 *
 * `draftPending` is derived server-side from the two pins disagreeing; it is never a stored flag, so a
 * client must not compute or cache its own.
 */
interface EntryPublicationState {
    diagnostics?: string[];
    release?: ReleaseRecord | null;
    id: string;
    draftPending: boolean;
    publishedVersion: string | null;
    publishedReadable: string | null;
    headVersion: string | null;
    headReadable: string | null;
    versions: EntryVersionData[];
    compileError: string | null;
}
interface NotifyEvent {
    type: "success" | "error";
    message: string;
}
/**
 * Everything host-specific, injected through one Provider. Only `client` is required; feedback is
 * optional with a dependency-free console default.
 */
interface UxBuilderServices {
    client: UxBuilderClient;
    /** Feedback sink; a dependency-free console default applies when omitted (no bundled toaster). */
    notify?: (event: NotifyEvent) => void;
}
/** Which editor the region mounts: form → SchemaForm; richtext/frame/list → preview editors. */
type RegionKind = "richtext" | "form" | "frame" | "list";
interface Region {
    id: string;
    /** placement label as it reads in the layout tree */
    label: string;
    kind: RegionKind;
    /**
     * The canonical record this region edits — the **entry id** the client loads/saves against
     * (ADR-0214 §2).
     *
     * Renamed from `record` deliberately when the addressing moved. Both a slug and an id are
     * `string`, so a host that kept feeding a slug into an id-addressed transport would have
     * typechecked cleanly and 404'd at runtime on every editor open; the rename is what turns that
     * into a compile error at every `Region` construction site.
     */
    recordId: string;
    /**
     * Optional human provenance line for the editor header (the small mono line under `label`).
     * Falls back to `recordId`. It exists because the header used to show the slug and a raw uuid is
     * strictly less useful there — a host that has the row should pass its slug.
     */
    recordLabel?: string;
    /** Served BeamUxEntryData.url; null when the entry has no public page address. */
    url?: string | null;
    /** one-line note shown in the editor header */
    note: string;
}
/** Structure-mode tree: layout → template → page → the region placements. */
interface TreeNode {
    id: string;
    label: string;
    kind: "layout" | "template" | "page" | "region";
    /** for region nodes, the region id it places */
    regionId?: string;
    children?: TreeNode[];
}
/** Component palette (Structure mode) — dropped into a placement, the page-composition layer. */
interface PaletteItem {
    key: string;
    label: string;
    kind: RegionKind;
    hint: string;
}

export { type EntryImageLibraryData as E, type FileDraftDiagnostic as F, type NotifyEvent as N, type PaletteItem as P, type Region as R, type SessionPageSettings as S, type TreeNode as T, type UxBuilderClient as U, type EntryImageData as a, type UxBuilderServices as b, type EntryPublicationState as c, type EntryBody as d, type RegionKind as e, type ReleaseRecording as f, type FileInspection as g, type FileReconcileInput as h, type FileReconcileResult as i, type ReleaseCommand as j, type ReleaseEntryChoice as k, ReleasePanel as l, type ReleaseRecord as m };
