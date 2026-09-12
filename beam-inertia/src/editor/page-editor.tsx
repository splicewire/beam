// In-place page editor — a THIN host wrapper over @splicewire/beam-ux/canvas's promoted PageEditor. All
// machinery (read/edit-mode fork, floating panels, canvas, inspector) lives in the package; the host
// injects only its CanvasConfig, transport, toast, theme, and defaults. Mount `<PageEditor slug body/>`
// where a page's content goes; read mode renders the same body via the package's TreeRender.
import { usePage } from '@inertiajs/react';
import type { JsonDoc } from '@splicewire/beam-ux/blockdoc/json';
import {
    CanvasProvider,
    PageEditor as CanvasPageEditor,
    useEditMode,
} from '@splicewire/beam-ux/canvas';
import type { CanvasTheme } from '@splicewire/beam-ux/canvas';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { canvasConfig } from './canvas-config';
import { defaultTreeFor } from './defaults';
import { NEUTRAL_THEME } from './theme';
import { bodyClient } from './transport';

/**
 * A persisted body is a JsonDoc only when it's a NON-EMPTY array of `{kind}` nodes; anything else —
 * including `[]` — returns null so the caller falls back to its seed.
 *
 * The empty case is the one that was wrong and the one that mattered. `EntryBodyShowOp` returns
 * `body: []` for an entry that has never been authored, and `[].every(…)` is vacuously true, so `[]`
 * passed as a document: `VisualEditorMount` skipped `seedFor(slug)` and opened the editor on a doc with
 * no root — nothing rendered, nothing was selectable, and "+ Heading" appeared to do nothing while
 * flipping the status to "Unsaved". Measured on beam.test's `/about` 2026-09-11
 * (G2-BEAM-AUTHOR-EMPTY-ENTRY). An author's FIRST block is exactly the case this seam must serve.
 */
export function asDoc(body: unknown): JsonDoc | null {
    return Array.isArray(body) &&
        body.length > 0 &&
        body.every(
            (n) => !!n && typeof n === 'object' && 'kind' in (n as object),
        )
        ? (body as JsonDoc)
        : null;
}

export interface PageEditorProps {
    slug: string;
    body?: unknown;
    /**
     * The entry's uuid — supplied by the page from its server-shared `entry` prop
     * (`App\Support\PageEntryRef`).
     *
     * The BODY transport is addressed by id (ADR-0214 §2), so without this the surface can render the
     * body it was handed but cannot persist one. `null` is the honest answer for a page whose row is
     * absent (a database that was never seeded): the default tree still renders, Save reports it.
     */
    entryId?: string | null;
}

/** The entry id, or the same honest failure the body transport has always raised without one. */
function addressed(entryId: string | null): string {
    if (entryId === null) {
        throw new Error('no entry id — nothing to save against');
    }

    return entryId;
}

/** The canvas document as the wire shape the entry-body operations declare. */
const asBody = (doc: JsonDoc): Record<string, unknown> => doc as unknown as Record<string, unknown>;

export function PageEditor({
    slug,
    body = null,
    entryId = null,
}: PageEditorProps) {
    // theme-entries-and-authoring ticket `str-01`: server-resolved theme, NEUTRAL_THEME as the
    // degrade-safe fallback (mirrors mount.tsx's VisualEditorMount).
    const page = usePage<{ theme?: { canvas?: Partial<CanvasTheme> } }>();
    const theme = page.props.theme?.canvas ?? NEUTRAL_THEME;

    // An AUTHOR edits the entry's persisted body, not the frontend seed.
    //
    // Without this, a hand-written page's editor always opened on `defaultTreeFor(slug)` — the page
    // passes `body={null}` because the server shares an entry REF, not a body — so the second authoring
    // session on `/` would start from the packaged default and overwrite the first one's work on Save.
    // That was invisible while read mode showed the same default tree; it stops being invisible the
    // moment the reader renders the real artifact (G2-BEAM-AUTHOR-ENTRY).
    //
    // Loaded only while EDITING and only once per entry: `EntryBodyShowOp` declares `ability:
    // 'ux.author'`, so firing it for a reader is a guaranteed 401 on every public page view, and
    // re-loading mid-session would overwrite the author's in-progress edits.
    const editing = useEditMode();
    const [loaded, setLoaded] = useState<{ body: unknown } | null>(null);

    useEffect(() => {
        if (!editing || entryId === null || loaded !== null) {
            return;
        }

        let live = true;
        bodyClient
            .loadBody(entryId)
            .then((env) => live && setLoaded({ body: (env as { body?: unknown })?.body ?? null }))
            // A failed load must not silently seed the default over a body that exists: report it and
            // leave the editor on whatever the page handed it.
            .catch(() => {
                if (live) {
                    toast.error('Could not load this page\u2019s saved content');
                    setLoaded({ body: null });
                }
            });

        return () => {
            live = false;
        };
    }, [editing, entryId, loaded]);

    // Do not mount the canvas until the body is in hand. `CanvasPageEditor` seeds its document ONCE, on
    // mount, so a body arriving afterwards can only be applied by re-seeding — and a re-seed discards
    // whatever the author has already done. Measured on beam.test 2026-09-11 (tools/explore-editor.mjs
    // section A): the FIRST inline edit of a session vanished, because the load landed between the
    // insert and the commit. Waiting is the fix; re-seeding is the defect wearing a `reloadToken`.
    if (editing && entryId !== null && loaded === null) {
        return <div style={{ padding: 24, color: '#64748b', fontSize: 13 }}>Loading editor…</div>;
    }

    return (
        <CanvasProvider config={canvasConfig}>
            <CanvasPageEditor
                slug={slug}
                body={asDoc(loaded?.body) ?? asDoc(body)}
                transport={{
                    // CanvasPageEditor's transport seam is keyed by its `slug` prop, which stays a slug
                    // — it is the editor's display label and `defaultTreeFor()` key. The BODY transport
                    // underneath is addressed by the entry ID (ADR-0214 §2). So the incoming `s` is
                    // deliberately unused: it names the page, not the row.
                    saveBody: (_s, doc) => bodyClient.saveBody(addressed(entryId), asBody(doc)),
                    // The publication seam (G2-BEAM-DRAFT-PUBLISH), spread in only when there IS a row
                    // to address. The dock renders the draft/publish/versions affordance iff all four
                    // arrive, so a page whose entry is absent (a database that was never seeded) keeps
                    // the plain Save dock and the honest error it already gives, rather than growing
                    // buttons that cannot resolve an id.
                    ...(entryId === null
                        ? {}
                        : {
                              saveDraft: (_s: string, doc: JsonDoc) =>
                                  bodyClient.saveDraft!(entryId, asBody(doc)),
                              publish: () => bodyClient.publish!(entryId),
                              listVersions: () => bodyClient.listVersions!(entryId),
                              restoreVersion: (_s: string, ref: string) =>
                                  bodyClient.restoreVersion!(entryId, ref),
                              // The canvas re-seeds itself from this after a restore; without it an
                              // author would keep editing the pre-restore document and Save it back
                              // over the version they just restored.
                              loadBody: () => bodyClient.loadBody(entryId),
                          }),
                }}
                notify={{
                    success: (m) => toast.success(m),
                    error: (m) => toast.error(m),
                }}
                fallbackDoc={defaultTreeFor}
                theme={theme}
                brand="beam-starter · editor"
            />
        </CanvasProvider>
    );
}

export default PageEditor;
