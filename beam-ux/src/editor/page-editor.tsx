// In-place page editor — a THIN host wrapper over @splicewire/beam-ux/canvas's promoted PageEditor. All
// machinery (read/edit-mode fork, floating panels, canvas, inspector) lives in the package; the host
// injects only its CanvasConfig, transport, toast, theme, and defaults. Mount `<PageEditor slug body/>`
// where a page's content goes; read mode renders the same body via the package's TreeRender.
import type { JsonDoc } from '../blockdoc/json';
import type { EntryPageSettings } from '../generated/page-settings';
import {
    CanvasProvider,
    PageEditor as CanvasPageEditor,
    useEditMode,
} from '../canvas';
import { useEffect, useState } from 'react';
import { useEditorKit } from './context';

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
        body.every((n) => !!n && typeof n === 'object' && 'kind' in (n as object))
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

export function PageEditor({ slug, body = null, entryId: suppliedId = null }: PageEditorProps) {
    // theme-entries-and-authoring ticket `str-01`: server-resolved theme, NEUTRAL_THEME as the
    // degrade-safe fallback (mirrors mount.tsx's VisualEditorMount).
    const { transport: bodyClient, theme, canAuthor, userId, canvasConfig, defaultTreeFor, notify: toast } = useEditorKit();

    const [created, setCreated] = useState<{slug: string; id: string} | null>(null);
    const [creating, setCreating] = useState(false);
    const entryId = suppliedId ?? (created?.slug === slug ? created.id : null);
    const seed = defaultTreeFor(slug);
    const makeEditable = async () => {
        if (!canAuthor || !bodyClient.makeEditable || !seed || creating) return;
        setCreating(true);
        try {
            const result = await bodyClient.makeEditable(slug, asBody(seed));
            if (!result.id) throw new Error('The server did not return an entry.');
            setCreated({slug, id: result.id});
            if (result.compileError) toast.error(result.compileError);
            else toast.success('This page is now editable');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not make this page editable');
        } finally { setCreating(false); }
    };

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
    const [loaded, setLoaded] = useState<{
        entryId: string;
        body: unknown;
        pageSettings?: EntryPageSettings | null;
        styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry; profile?: import('@schemastud/blockdoc').BlockdocManifest;
        failed?: boolean;
        bindings?: import('../bindings/runtime.js').BindingPayload;
    } | null>(null);

    const current = loaded?.entryId === entryId ? loaded : null;

    useEffect(() => {
        if (!editing || entryId === null || current !== null) {
            return;
        }

        let live = true;
        bodyClient
            .loadBody(entryId)
            .then(
                (env) =>
                    live && setLoaded({ entryId, body: (env as { body?: unknown })?.body ?? null, pageSettings: (env as { pageSettings?: EntryPageSettings | null }).pageSettings, bindings: (env as { bindings?: import('../bindings/runtime.js').BindingPayload }).bindings, styleRegistry: (env as { styleRegistry?: import("../blockdoc/style-runtime.js").StyleRegistry }).styleRegistry, profile: (env as { styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry; profile?: import('@schemastud/blockdoc').BlockdocManifest }).profile }),
            )
            // A refused read is not an empty body: keep replacement writes unavailable.
            .catch(() => {
                if (live) {
                    toast.error('Could not load this page\u2019s saved content');
                    setLoaded({ entryId, body: null, failed: true });
                }
            });

        return () => {
            live = false;
        };
    }, [editing, entryId, current]);

    // Do not mount the canvas until the body is in hand. `CanvasPageEditor` seeds its document ONCE, on
    // mount, so a body arriving afterwards can only be applied by re-seeding — and a re-seed discards
    // whatever the author has already done. Measured on beam.test 2026-09-11 (tools/explore-editor.mjs
    // section A): the FIRST inline edit of a session vanished, because the load landed between the
    // insert and the commit. Waiting is the fix; re-seeding is the defect wearing a `reloadToken`.
    if (editing && entryId !== null && current === null) {
        return <div style={{ padding: 24, color: '#64748b', fontSize: 13 }}>Loading editor…</div>;
    }

    if (editing && current?.failed) {
        return <div role="alert">Could not load this page’s saved content.</div>;
    }

    const { saveDraft, publish, listVersions, restoreVersion, clearBody } = bodyClient;
    // "Remove content" is offered only to a viewer who holds the ability `clear-body` declares
    // (`ux.author`, shared as `auth.canAuthorUx`), and only when there is a row to address. The server
    // refuses everyone else anyway; the gate here keeps the button from being a guaranteed 403.
    const canClear = entryId !== null && !!clearBody && canAuthor;

    return (
        <CanvasProvider config={{ ...canvasConfig, profile: current?.profile, styleRegistry: current?.styleRegistry, bindings: current?.bindings }}>
            {entryId === null && canAuthor && bodyClient.makeEditable && seed && (
                <button type="button" disabled={creating} onClick={makeEditable}>Make this page editable</button>
            )}
            <CanvasPageEditor
                key={entryId ?? slug}
                slug={slug}
                entryId={entryId ?? undefined}
                userId={userId}
                body={asDoc(current?.body) ?? asDoc(body)}
                pageSettings={current?.pageSettings}
                transport={{
                    // CanvasPageEditor's transport seam is keyed by its `slug` prop, which stays a slug
                    // — it is the editor's display label and `defaultTreeFor()` key. The BODY transport
                    // underneath is addressed by the entry ID (ADR-0214 §2). So the incoming `s` is
                    // deliberately unused: it names the page, not the row.
                    saveBody: (_s, doc) => bodyClient.saveBlocks
                        ? bodyClient.saveBlocks(addressed(entryId), doc)
                        : bodyClient.saveBody(addressed(entryId), asBody(doc)),
                    ...(entryId && bodyClient.printSource && bodyClient.readSource ? {
                        printSource: (_s: string, body: JsonDoc) => bodyClient.printSource!(entryId, body),
                        readSource: (_s: string, source: string, body: JsonDoc) => bodyClient.readSource!(entryId, source, body),
                    } : {}),
                    // The publication seam (G2-BEAM-DRAFT-PUBLISH), spread in only when there is a row
                    // to address and the client supplies all four operations. A page whose entry is absent
                    // (a database that was never seeded) keeps
                    // the plain Save dock and the honest error it already gives, rather than growing
                    // buttons that cannot resolve an id.
                    ...(entryId === null ||
                    !saveDraft ||
                    !publish ||
                    !listVersions ||
                    !restoreVersion
                        ? {}
                        : {
                              saveDraft: (_s: string, doc: JsonDoc, baseVersion: string | null, settings?: import("./local-session").SessionPageSettings | null) =>
                                  settings ? saveDraft(entryId, asBody(doc), baseVersion, undefined, settings) : saveDraft(entryId, asBody(doc), baseVersion),
                              publish: (_s: string, ref: string) => publish(entryId, ref),
                              releaseCommand: bodyClient.releaseCommand?.bind(bodyClient),
                              listVersions: () => listVersions(entryId),
                              restoreVersion: (_s: string, ref: string) =>
                                  restoreVersion(entryId, ref),
                              // The canvas re-seeds itself from this after a restore; without it an
                              // author would keep editing the pre-restore document and Save it back
                              // over the version they just restored.
                              loadBody: () => bodyClient.loadBody(entryId),
                          }),
                    ...(canClear && entryId !== null
                        ? { clearBody: () => clearBody(entryId) }
                        : {}),
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
