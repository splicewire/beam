// In-place page editor: renders the entry's body INSIDE the real page (host layout chrome + full class
// hierarchy intact, so styles are correct), read-only until an operator enters window mode (via the host's
// dock "Edit content"), then the same content region becomes editable with FLOATING panels (Insert ·
// Inspector) + Save + Exit. The mode seam (`beam-ux:mode` / `beam-ux:exit` window events) is preserved.
//
// Unlike VisualEditor (window mode), this does NOT adopt FiveRegionEditShell — that shell is a fixed
// five-region layout taking over the whole surface, and PageEditor's entire point is the opposite: edit
// the real page, in its own real layout, with floating panels on top. It keeps its own hand-rolled
// chrome. What it DOES share with VisualEditor: the same CanvasWidget (mounted directly here, not via
// a registered heavyweight widget — no WidgetSurface/registry needed for a direct mount) and the same
// EditShellMount-driven, schema-generated Inspector (@schemastud/frame's own) — one canvas-editing
// implementation and one attrs-editing implementation, shared by both mount modes.
//
// frame's Inspector calls <SchemaForm> with no `registry` prop, so it resolves widgets off
// WidgetRegistryContext (or seam's bare default if nothing provides one) — FiveRegionEditShell wraps
// that provider itself (window mode gets it for free); PageEditor has no such shell, so it provides
// the SAME canvas widget registry (class-chips/style-rows) itself, or className/style would silently
// fall back to plain text inputs instead of the chip/row UX.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { EditShellMountProvider, Inspector as FrameInspector, useEditShellMountController } from '@schemastud/frame';
import { WidgetRegistryContext } from '@schemastud/seam';
import { getAt, isJsonBlock } from '../blockdoc/json.js';
import type { JsonDoc } from '../blockdoc/json.js';
import type { EntryPublicationState, EntryVersion } from '../types.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasPalette } from './CanvasPalette.js';
import { CanvasWidget } from './CanvasWidget.js';
import { peCss, veCss } from './css.js';
import type { CanvasTheme } from './css.js';
import { TreeRender } from './TreeRender.js';
import { createCanvasWidgetRegistry } from './widgetRegistry.js';

/**
 * The persistence seam — the host injects load/save (audiostud routes them through puckClient).
 *
 * The four PUBLICATION methods are OPTIONAL and travel together: supply them and the dock grows the
 * draft/publish affordance, omit them and it is exactly the Save/Exit dock it has always been. That is
 * deliberate — a host mounts `save-draft` / `publish` / `versions` / `restore` on purpose, and one that
 * has not is not broken, it has the immediate-publish write it always had. Rendering the buttons
 * unconditionally and letting them 404 would make "this host does not do drafts" and "this host's
 * draft button is broken" the same picture.
 */
export interface PageEditorTransport {
    /**
     * Persist the document. The RESPONSE is read, not discarded: a host whose save op answers with a
     * `compileError` (the beam-ux entry envelope does) has stored the body but produced no artifact for
     * a reader, and {@link compileErrorOf} turns that into the same error the publish path reports.
     * Still typed `unknown` — a host is free to answer with anything, including nothing.
     */
    saveBody: (slug: string, body: JsonDoc) => Promise<unknown>;
    loadBody?: (slug: string) => Promise<{ body?: unknown } | unknown>;
    /** Record the document as a draft: versioned, not published — readers keep the published body. */
    saveDraft?: (slug: string, body: JsonDoc) => Promise<EntryPublicationState>;
    /** Publish the working copy through the real compile path. */
    publish?: (slug: string) => Promise<EntryPublicationState>;
    /** The recorded history plus both pins — refetched whenever the panel opens. */
    listVersions?: (slug: string) => Promise<EntryPublicationState>;
    /** Roll forward to a recorded version and publish it. */
    restoreVersion?: (slug: string, ref: string) => Promise<EntryPublicationState>;
    /**
     * REMOVE the page's content — `beam-ux-entry.clear-body` on a beam-ux host: the stored body, its
     * mirror file and its compiled artifact go, and the page reads as never authored. Optional and
     * independent of the four above: a host supplies it only for an author who holds the publish
     * ability, and the dock renders "Remove content" only when it is supplied. Not the same act as
     * saving an empty document, which stays an authored (and published) empty body.
     */
    clearBody?: (slug: string) => Promise<EntryPublicationState | unknown>;
}

/** Optional toast seam (host injects; the package never imports a toast lib). */
export interface Notify {
    success: (msg: string) => void;
    error: (msg: string) => void;
}

export interface PageEditorProps {
    slug: string;
    /** The initial body (a JsonDoc, or a legacy/absent body → falls back to `fallbackDoc` or empty). */
    body?: JsonDoc | null;
    transport: PageEditorTransport;
    notify?: Notify;
    theme?: Partial<CanvasTheme>;
    /** A per-slug default body when `body` is absent (host-supplied, e.g. `defaultTreeFor`). */
    fallbackDoc?: (slug: string) => JsonDoc | null;
    /** Brand label shown in the floating bar. */
    brand?: string;
    /**
     * Undo/redo — entirely host-injected (the package stays version-blind, ADR-0116 four-kind seam).
     * Buttons render only when supplied. See {@link VisualEditorProps} for the same seam in window mode.
     */
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    /**
     * Bump (any changed value) to force the editor to re-seed its internal `doc` from the current
     * `body` prop — e.g. after a host-side undo/redo restore changed the entry's saved body out from
     * under an already-mounted editor. `doc` is otherwise uncontrolled (seeded once via `useState`),
     * so a `body` prop change alone does nothing after the first render. Deliberately NOT a `key`-based
     * remount at the call site: that would also reset {@link useEditMode}'s own local `editing` state
     * back to read mode (it forgets it was ever in window mode until the next `beam-ux:mode` broadcast),
     * silently kicking an operator out of the editor on every undo/redo.
     */
    reloadToken?: number | string;
}

const EMPTY_DOC: JsonDoc = [
    { kind: 'block', name: 'div', isComponent: false, props: [], children: [], dynamic: false },
];

/**
 * Is `b` a usable persisted JsonDoc?
 *
 * `[]` is deliberately NOT one, and that is the whole point: the server returns `body: []` for an entry
 * that has never been authored, and `[].every(…)` is vacuously true, so an empty array used to pass as a
 * document and suppress the seed. The editor then opened on a doc with no root — nothing to render,
 * nothing to select, and (before `insertRelativeTo` learned to append at the root) nothing insertable.
 * Measured on beam.test 2026-09-11, G2-BEAM-AUTHOR-EMPTY-ENTRY. "Never authored" must reach the
 * fallback, which is what `null` here means.
 */
const isDoc = (b: unknown): b is JsonDoc =>
    Array.isArray(b) &&
    b.length > 0 &&
    b.every((n) => !!n && typeof n === 'object' && 'kind' in (n as object));

/**
 * The compile diagnostic carried on a save response, or `null` when there is none.
 *
 * Read defensively rather than typed, because {@link PageEditorTransport.saveBody} promises `unknown`:
 * a host may answer with the beam-ux entry envelope (`BeamUxEntryBodyData`, which carries
 * `compileError: string | null`), with some shape of its own, or with nothing at all, and only the
 * first of those has anything to say. An empty string is not a diagnostic — it would toast a blank
 * error, which is worse than the silence it replaced.
 */
const compileErrorOf = (response: unknown): string | null => {
    if (!response || typeof response !== 'object') return null;

    const value = (response as { compileError?: unknown }).compileError;

    return typeof value === 'string' && value !== '' ? value : null;
};

/** Whether `path` resolves to a `block` node the lens parsed from a PascalCase (component) tag —
 * see `CanvasNode`'s `data-bd-component` for the canvas-side half of this same distinction. */
const isSelectedNodeComponent = (doc: JsonDoc, path: string): boolean => {
    const node = getAt(doc, path);

    return !!node && isJsonBlock(node) && node.isComponent;
};

/**
 * The CURRENT authoring mode, remembered across mounts.
 *
 * `beam-ux:mode` is a one-shot broadcast: a listener that subscribes after it fired never learns the
 * mode. That was harmless while every consumer was mounted for the life of the page, and stopped being
 * harmless the moment a page FORKED on the mode — `site/home` renders the compiled artifact for a
 * reader and the editor for an author, so entering window mode is precisely what mounts the editor,
 * and the editor then subscribed one tick too late and reported read mode forever. Measured on
 * beam.test 2026-09-11: the dock's "Edit content" dispatched `{mode:'window'}`, the page swapped to the
 * editor, and the editor rendered the read tree.
 *
 * So the mode is state, not an event, and the event is how it CHANGES. A module-level store is the
 * right shape for it: there is exactly one authoring mode per document, the host owns it, and every
 * consumer must agree with every other one.
 */
const editModeStore = {
    current: false,
    listeners: new Set<() => void>(),
    listening: false,
};

function subscribeEditMode(onChange: () => void): () => void {
    editModeStore.listeners.add(onChange);

    if (!editModeStore.listening && typeof window !== 'undefined') {
        editModeStore.listening = true;
        window.addEventListener('beam-ux:mode', (e: Event) => {
            const next = (e as CustomEvent<{ mode?: string }>).detail?.mode === 'window';

            if (next === editModeStore.current) return;

            editModeStore.current = next;
            for (const listener of editModeStore.listeners) listener();
        });
    }

    return () => {
        editModeStore.listeners.delete(onChange);
    };
}

/**
 * Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast.
 *
 * Reads the CURRENT mode, not just subsequent changes — see {@link editModeStore}. `false` on the
 * server, where there is no host and no broadcast.
 */
export function useEditMode(): boolean {
    return useSyncExternalStore(
        subscribeEditMode,
        () => editModeStore.current,
        () => false,
    );
}

/** Test seam: forget the remembered mode. Nothing in a running app resets it; a suite must. */
export function __resetEditMode(): void {
    editModeStore.current = false;
    for (const listener of editModeStore.listeners) listener();
}

export function PageEditor({
    slug,
    body = null,
    transport,
    notify,
    theme,
    fallbackDoc,
    brand,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    reloadToken,
}: PageEditorProps) {
    const editing = useEditMode();
    const initial: JsonDoc = isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC;
    const [doc, setDoc] = useState<JsonDoc>(initial);
    // Re-seed on an explicit host-driven reload only (see PageEditorProps.reloadToken) — reading the
    // latest body/fallbackDoc/slug from this render's closure, not from a dependency-tracked value, so
    // an incidental `body` prop identity change (e.g. a host re-render) never overwrites in-progress
    // local edits; only a genuine `reloadToken` bump does.
    useEffect(() => {
        if (reloadToken === undefined) return;
        setDoc(isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadToken]);
    const mount = useEditShellMountController();
    // The canvas widget itself is never resolved off this registry (CanvasWidget is mounted directly
    // below, not via WidgetSurface) — this exists purely so frame's Inspector's SchemaForm resolves
    // class-chips/style-rows for className/style instead of falling back to plain text inputs.
    const registry = useMemo(() => createCanvasWidgetRegistry(), []);
    const [leftOpen, setLeftOpen] = useState(true);
    // Closed by default (nothing to show); auto-opens on selection, and the Inspector button forces it open.
    const [rightOpen, setRightOpen] = useState(false);

    // Auto-open the Inspector on selection (mirrors the old onCanvasClick side effect) — selection now
    // happens INSIDE CanvasWidget (it drives mount.selectNode directly), so this watches the mount.
    useEffect(() => {
        if (mount.selectedNodeId) setRightOpen(true);
    }, [mount.selectedNodeId]);

    // ── Publication: draft / publish / versions / restore ─────────────────────────────────────────
    // The whole affordance is gated on the transport actually carrying the seam. All four or none:
    // a dock offering Save draft with no Publish would strand an author's work where no reader can
    // reach it, which is worse than not offering drafts at all.
    const publishable = !!(
        transport.saveDraft &&
        transport.publish &&
        transport.listVersions &&
        transport.restoreVersion
    );
    const [publication, setPublication] = useState<EntryPublicationState | null>(null);
    const [versionsOpen, setVersionsOpen] = useState(false);
    const [pendingRestore, setPendingRestore] = useState<EntryVersion | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const [busy, setBusy] = useState(false);
    // One attempt, not one per render: `transport` is an object literal at most call sites, so a
    // dependency on it re-runs every render, and a FAILED load would then retry forever. The ref is
    // what makes "we asked and it did not answer" a terminal state rather than a loop.
    const askedForPublication = useRef(false);

    useEffect(() => {
        if (!editing || !publishable || askedForPublication.current) return;
        askedForPublication.current = true;

        let live = true;
        transport
            .listVersions?.(slug)
            .then((state) => live && setPublication(state))
            // Silent: the draft badge is an enrichment of a dock that works without it, and a toast on
            // every editor open would be noise on a host mid-migration.
            .catch(() => {});

        return () => {
            live = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, publishable, slug]);

    // Read mode: the plain page (correct chrome + styles), no editing overhead.
    if (!editing) {
        return <TreeRender tree={doc} />;
    }

    /**
     * Write the canvas document — the immediate-publish path, and on this host a save IS a publish
     * (`EntryBodySaveOp` records the version, moves the pin and compiles the artifact).
     *
     * So it reports a compile diagnostic exactly the way {@link publish} does: the write LANDED — the
     * body is stored and the canvas is no longer dirty — but the compile that follows the pin did not,
     * which means there is no artifact at the new address and a reader is served the packaged default
     * over a body that is perfectly intact. Saying "Saved" to that is the one sentence an author can
     * act on and would be wrong: the document they are looking at is not the document anyone else can
     * see until it compiles. A thrown failure would be the wrong shape for the same reason it is wrong
     * for publish — nothing was lost, one step of three did not finish.
     */
    const save = async () => {
        mount.markSaving(true);
        try {
            await mount.flush();
            const compileError = compileErrorOf(await transport.saveBody(slug, doc));
            mount.markDirty(false);
            if (compileError) notify?.error(compileError);
            else notify?.success('Saved');
        } catch {
            notify?.error('Save failed');
        } finally {
            mount.markSaving(false);
        }
    };
    const exit = () => window.dispatchEvent(new CustomEvent('beam-ux:exit'));

    /**
     * Record the canvas document as a DRAFT. Same flush-then-write as {@link save}, and deliberately
     * the same "the document is no longer dirty" outcome — a draft IS persisted; what it is not is
     * published.
     */
    const saveDraft = async () => {
        if (!transport.saveDraft) return;
        setBusy(true);
        try {
            await mount.flush();
            setPublication(await transport.saveDraft(slug, doc));
            mount.markDirty(false);
            notify?.success('Draft saved');
        } catch {
            notify?.error('Draft save failed');
        } finally {
            setBusy(false);
        }
    };

    /**
     * Publish the working copy. It sends no document: what it publishes is what the server already
     * holds, which is the distinction between this and Save.
     *
     * A compile diagnostic comes back on the state rather than as a thrown failure — the publish has
     * landed by then — so it is reported as an error toast over a publication that really did happen.
     */
    const publish = async () => {
        if (!transport.publish) return;
        setBusy(true);
        try {
            const next = await transport.publish(slug);
            setPublication(next);
            if (next.compileError) notify?.error(next.compileError);
            else notify?.success('Published');
        } catch {
            notify?.error('Publish failed');
        } finally {
            setBusy(false);
        }
    };

    /** Open/close the history panel, refetching on every open so it can never show a stale HEAD. */
    const toggleVersions = async () => {
        const opening = !versionsOpen;
        setVersionsOpen(opening);
        setPendingRestore(null);
        if (!opening) return;
        // One panel at a time on the right edge; they occupy the same strip.
        setRightOpen(false);
        setBusy(true);
        try {
            if (transport.listVersions) setPublication(await transport.listVersions(slug));
        } catch {
            notify?.error('Could not load the version history');
        } finally {
            setBusy(false);
        }
    };

    /**
     * Roll forward to a recorded version — and RE-SEED THE CANVAS from what the server now holds.
     *
     * Without the re-seed the author would be looking at the document they had before the restore,
     * and the next Save would write it straight back over the version they just restored. The editor
     * cannot re-seed from the publication state (a version list deliberately carries no bodies), so it
     * re-reads through the same `loadBody` seam the host already supplies; a transport without one
     * says so rather than leaving a stale canvas looking authoritative.
     */
    const restore = async (version: EntryVersion) => {
        if (!transport.restoreVersion) return;
        setBusy(true);
        try {
            setPublication(await transport.restoreVersion(slug, version.readable));
            setPendingRestore(null);

            if (transport.loadBody) {
                const restored = (await transport.loadBody(slug)) as { body?: unknown } | undefined;
                if (isDoc(restored?.body)) setDoc(restored.body);
                mount.markDirty(false);
                notify?.success(`Restored ${version.readable}`);
            } else {
                notify?.success(`Restored ${version.readable} — reload to edit it`);
            }
        } catch {
            notify?.error(`Could not restore ${version.readable}`);
        } finally {
            setBusy(false);
        }
    };

    /**
     * Remove the page's content, after the confirm step — and re-seed the canvas to the UNAUTHORED
     * document, because that is what the server now holds. Without the re-seed the author would keep
     * looking at the removed body, and the next Save would put it straight back.
     *
     * The response is the publication state when the host returns one (beam-ux does); anything else
     * leaves the badge as it was rather than guessing.
     */
    const clearContent = async () => {
        if (!transport.clearBody) return;
        setBusy(true);
        try {
            const next = await transport.clearBody(slug);
            if (next && typeof next === 'object' && 'versions' in next) {
                setPublication(next as EntryPublicationState);
            }
            setDoc(fallbackDoc?.(slug) ?? EMPTY_DOC);
            mount.markDirty(false);
            setConfirmClear(false);
            notify?.success('Content removed');
        } catch {
            notify?.error('Could not remove the content');
        } finally {
            setBusy(false);
        }
    };

    return (
        <WidgetRegistryContext.Provider value={registry}>
            <EditShellMountProvider value={mount}>
                <style dangerouslySetInnerHTML={{ __html: veCss(theme) + peCss(theme) }} />

                {/* The content region — IN PLACE (inside the page's layout), so classes + scoped CSS apply.
                    hideBreadcrumb: PageEditor renders its own breadcrumb in the floating Inspector panel
                    below — the in-flow one would render at the top of the real page's content, which is
                    exactly where the floating pe-left/pe-right panels sit, so it was rendering almost
                    entirely behind them (found live: only its LAST segment's last few pixels peeked out
                    past the left panel's edge). */}
                <CanvasWidget value={doc} onChange={setDoc} editShellMount={mount} theme={theme} hideBreadcrumb />

                {/* Floating editor chrome — fixed over the page. */}
                <div className="pe-bar">
                    <span className="pe-brand">
                        <span className="pe-mark" />
                        {brand ?? `editing · ${slug}`}
                    </span>
                    <span style={{ flex: 1 }} />
                    {(onUndo || onRedo) && (
                        <>
                            <button className="pe-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
                                ↶ Undo
                            </button>
                            <button className="pe-btn" onClick={onRedo} disabled={!canRedo} title="Redo">
                                ↷ Redo
                            </button>
                        </>
                    )}
                    <button className="pe-btn" onClick={() => setLeftOpen((v) => !v)}>
                        Insert
                    </button>
                    <button className="pe-btn" onClick={() => setRightOpen((v) => !v)}>
                        Inspector
                    </button>
                    {publishable && (
                        <>
                            {/* The one piece of state an author cannot infer from the canvas: their
                                working copy is ahead of what readers are being served. Named, with the
                                version readers are actually on, because "unpublished changes" without
                                saying what is live is the half of the sentence that matters. */}
                            {publication?.draftPending && (
                                <span className="pe-draft">
                                    Draft pending
                                    {publication.publishedReadable
                                        ? ` · readers see ${publication.publishedReadable}`
                                        : ''}
                                </span>
                            )}
                            <button className="pe-btn" onClick={saveDraft} disabled={busy}>
                                Save draft
                            </button>
                            <button className="pe-btn" onClick={publish} disabled={busy}>
                                Publish
                            </button>
                            <button className="pe-btn" onClick={toggleVersions} disabled={busy}>
                                Versions
                            </button>
                        </>
                    )}
                    {transport.clearBody && (
                        <button
                            className="pe-btn"
                            onClick={() => setConfirmClear(true)}
                            disabled={busy}
                        >
                            Remove content
                        </button>
                    )}
                    {/* Save stays the IMMEDIATE-PUBLISH affordance it has always been, label included:
                        it is what `g2-beam-author-entry` proves and what an author who never opens the
                        draft door expects. The pair above is additive, never a re-spelling of this. */}
                    <button className="pe-btn primary" onClick={save}>
                        Save
                    </button>
                    <button className="pe-btn" onClick={exit}>
                        Exit
                    </button>
                </div>

                {/* Removing content is CONFIRMED, never one click, for the same reason restore is:
                    it changes what every reader of the page is served. */}
                {confirmClear && (
                    <div className="pe-panel pe-clear">
                        <div className="pe-confirm" role="alertdialog" aria-label="Confirm remove content">
                            <span>
                                Remove this page’s content? The stored body, its file and its compiled
                                page are deleted and readers see the page as never authored. The
                                removed body stays in the version history.
                            </span>
                            <div className="pe-confirm-actions">
                                <button className="pe-btn primary" onClick={clearContent} disabled={busy}>
                                    Confirm remove
                                </button>
                                <button className="pe-btn" onClick={() => setConfirmClear(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {leftOpen && (
                    <aside className="pe-panel pe-left">
                        <CanvasPalette />
                    </aside>
                )}

                {/* Closed by default; the Inspector button opens it (empty hint until you select
                    something), and selecting an element auto-opens it with that element's properties.
                    frame's own Inspector already renders its own empty state when nothing is selected. */}
                {/* The version history — the same right-hand strip as the Inspector, so they toggle
                    each other rather than stacking. Restore is CONFIRMED, never one click: it changes
                    what every reader of the page is served, which is not an undoable local edit. */}
                {versionsOpen && (
                    <aside className="pe-panel pe-versions" aria-label="Versions">
                        <h3>Versions</h3>

                        {pendingRestore && (
                            <div className="pe-confirm" role="alertdialog" aria-label="Confirm restore">
                                <span>
                                    Restore {pendingRestore.readable}? It becomes the published body
                                    every reader is served.
                                </span>
                                <div className="pe-confirm-actions">
                                    <button
                                        className="pe-btn primary"
                                        onClick={() => restore(pendingRestore)}
                                        disabled={busy}
                                    >
                                        Confirm restore
                                    </button>
                                    <button className="pe-btn" onClick={() => setPendingRestore(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {publication === null && <div className="pe-version">Loading…</div>}
                        {publication !== null && publication.versions.length === 0 && (
                            <div className="pe-version">
                                Nothing recorded yet — a draft, a publish or a save records the first
                                version.
                            </div>
                        )}

                        {publication?.versions.map((version) => (
                            <div className="pe-version" key={version.id}>
                                {/* Ref and label share one shrinkable text column, stacked. As two
                                    sibling flex items, a long generated ref ("v279-restore-of-v277-
                                    published") kept its full width and squeezed the label to one
                                    character per line beside it (replay-6 G2-BEAM-DRAFT-PUBLISH). */}
                                <span className="pe-version-text">
                                    <span className="pe-version-ref" title={version.readable}>
                                        {version.readable}
                                    </span>
                                    {version.label && (
                                        <span className="pe-version-label" title={version.label}>
                                            {version.label}
                                        </span>
                                    )}
                                </span>
                                {version.isPublished && (
                                    <span className="pe-version-tag published">published</span>
                                )}
                                {version.isHead && !version.isPublished && (
                                    <span className="pe-version-tag head">draft</span>
                                )}
                                {!version.isPublished && (
                                    <button
                                        className="pe-btn"
                                        aria-label={`Restore ${version.readable}`}
                                        onClick={() => setPendingRestore(version)}
                                        disabled={busy}
                                    >
                                        Restore
                                    </button>
                                )}
                            </div>
                        ))}
                    </aside>
                )}

                {rightOpen && !versionsOpen && (
                    <aside className="pe-panel pe-right">
                        {mount.selectedNodeId && (
                            <>
                                <Breadcrumb doc={doc} path={mount.selectedNodeId} onSelect={mount.selectNode} />
                                {isSelectedNodeComponent(doc, mount.selectedNodeId) && (
                                    <div className="pe-comp-badge">◆ component</div>
                                )}
                            </>
                        )}
                        <FrameInspector />
                    </aside>
                )}
            </EditShellMountProvider>
        </WidgetRegistryContext.Provider>
    );
}

export default PageEditor;
