// The generated DTO projection (rehome-ui), sliced off the app's single `generated.d.ts` and
// delivered as a bundle. This build-time dependency is LOAD-BEARING — the builder's default typing
// IS the projection, so the PHP source of truth genuinely travels into this package. tsup keeps the
// `import type` in the shipped `dist/index.d.ts`.
import type { BeamUxEntryBodyData } from '@splicewire/_resources/types/beam-ux';

export type { BeamUxEntryBodyData };

/* ─────────────────────────── the injection seam ─────────────────────────── */

/**
 * The injected transport adapter — the ONE data seam a host must implement. It wraps whatever
 * transport the host already has (axios, fetch, a server action) and points it at the correct
 * tenant; the components are tenant-blind. Generic over the entry-body DTO with a default bound to
 * the generated projection: DTO-first with zero host effort by default, while a non-Laravel host
 * with a divergent shape can bind its own.
 */
export interface UxBuilderClient<TBody = BeamUxEntryBodyData> {
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
    /**
     * Persist a region's body — returns the fresh projection
     * (`POST .../beam-ux-entries/{id}/op/save-body`). Addressed by id, same as {@link loadBody}.
     */
    saveBody(id: string, body: Record<string, unknown>): Promise<TBody>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider. Only `client` is required; feedback is
 * optional with a dependency-free console default.
 */
export interface UxBuilderServices {
    client: UxBuilderClient;
    /** Feedback sink; a dependency-free console default applies when omitted (no bundled toaster). */
    notify?: (event: NotifyEvent) => void;
}

/* ─────────────────────────── presentational domain shapes ─────────────────────────── */
// These are the builder's structural VIEW-MODEL props (composition/region shapes) — NOT DTOs.
// Lifted verbatim from the prototype fixture so the surfaces stay portable and the host provides
// them (or a default demo set).

/** Which editor the region mounts: form → SchemaForm; richtext/frame/list → preview editors. */
export type RegionKind = 'richtext' | 'form' | 'frame' | 'list';

export interface Region {
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
export interface TreeNode {
    id: string;
    label: string;
    kind: 'layout' | 'template' | 'page' | 'region';
    /** for region nodes, the region id it places */
    regionId?: string;
    children?: TreeNode[];
}

/** Component palette (Structure mode) — dropped into a placement, the page-composition layer. */
export interface PaletteItem {
    key: string;
    label: string;
    kind: RegionKind;
    hint: string;
}
