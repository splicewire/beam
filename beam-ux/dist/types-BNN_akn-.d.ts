import * as react from 'react';
import { WorkflowProjectionData } from '@splicewire/beam-workflows';
import { J as JsonDoc } from './json-BGmPsDn-.js';
import { BeamUxEntryBodyData } from '@splicewire/beam-resources/types/beam-ux';

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
}

type SessionPageSettings = Partial<EntryPageSettings>;

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
}
interface ReleaseCommand {
    action: 'member' | 'drop' | 'rebase' | 'use-latest' | 'submit' | 'approve' | 'publish' | 'schedule' | 'rollback';
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
declare function ReleasePanel({ release, entries, onCommand }: {
    release: ReleaseRecord;
    entries: ReleaseEntryChoice[];
    onCommand: (command: ReleaseCommand) => Promise<unknown>;
}): react.JSX.Element;

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
    saveBody(id: string, body: Record<string, unknown>): Promise<TBody>;
    /** Record a body as a DRAFT: written and versioned, NOT published — readers keep the published body. */
    saveDraft?(id: string, body: Record<string, unknown>, baseVersion: string | null, label?: string, pageSettings?: SessionPageSettings | null): Promise<EntryPublicationState>;
    /** Publish the working copy: move the publication pin, mirror to disk, compile the artifact. */
    publish?(id: string, ref: string, label?: string): Promise<EntryPublicationState>;
    /** The recorded version history plus both pins. */
    listVersions?(id: string): Promise<EntryPublicationState>;
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
    releaseCommand?(releaseId: string, command: ReleaseCommand): Promise<ReleaseRecord>;
    listReleases?(): Promise<Array<{
        id: string;
        title: string;
    }>>;
}
/**
 * One recorded version of an entry body — the projection of
 * `Splicewire\Beam\Ux\Data\EntryVersionData`.
 *
 * ⚠️ **Hand-declared here, unlike {@link BeamUxEntryBodyData}, and that is a known gap rather than a
 * design.** The generated projection travels through `@splicewire/beam-resources`, whose `types/` are
 * emitted by the flagship's `resources:beam` pipeline from its own `typescript:transform` run — a
 * regeneration this pass did not run. The fields below are the PHP DTO's fields and nothing else; the
 * first `resources:beam` run after this lands should emit them and these two declarations should be
 * re-exported from the bundle instead of written here.
 */
interface EntryVersion {
    id: string;
    version: number;
    readable: string;
    label: string | null;
    createdBy: string | null;
    createdAt: string | null;
    /** The working HEAD — the body an author currently edits. */
    isHead: boolean;
    /** The published body — the one a guest reader is served. */
    isPublished: boolean;
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
    release?: ReleaseRecord | null;
    id: string;
    draftPending: boolean;
    publishedVersion: string | null;
    publishedReadable: string | null;
    headVersion: string | null;
    headReadable: string | null;
    versions: EntryVersion[];
    compileError: string | null;
}
interface NotifyEvent {
    type: 'success' | 'error';
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
type RegionKind = 'richtext' | 'form' | 'frame' | 'list';
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
    /** one-line note shown in the editor header */
    note: string;
}
/** Structure-mode tree: layout → template → page → the region placements. */
interface TreeNode {
    id: string;
    label: string;
    kind: 'layout' | 'template' | 'page' | 'region';
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

export { type EntryPublicationState as E, type NotifyEvent as N, type PaletteItem as P, type ReleaseCommand as R, type SessionPageSettings as S, type TreeNode as T, type UxBuilderClient as U, type ReleaseRecord as a, type UxBuilderServices as b, type Region as c, type RegionKind as d, type EntryVersion as e, type ReleaseEntryChoice as f, ReleasePanel as g };
