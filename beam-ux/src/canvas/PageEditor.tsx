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
import { useEffect, useMemo, useState } from 'react';
import { EditShellMountProvider, Inspector as FrameInspector, useEditShellMountController } from '@schemastud/frame';
import { WidgetRegistryContext } from '@schemastud/seam';
import type { JsonDoc } from '../blockdoc/json.js';
import { CanvasPalette } from './CanvasPalette.js';
import { CanvasWidget } from './CanvasWidget.js';
import { peCss, veCss } from './css.js';
import type { CanvasTheme } from './css.js';
import { TreeRender } from './TreeRender.js';
import { createCanvasWidgetRegistry } from './widgetRegistry.js';

/** The persistence seam — the host injects load/save (audiostud routes them through puckClient). */
export interface PageEditorTransport {
    saveBody: (slug: string, body: JsonDoc) => Promise<unknown>;
    loadBody?: (slug: string) => Promise<{ body?: unknown } | unknown>;
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

const isDoc = (b: unknown): b is JsonDoc =>
    Array.isArray(b) && b.every((n) => !!n && typeof n === 'object' && 'kind' in (n as object));

/** Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast. */
export function useEditMode(): boolean {
    const [editing, setEditing] = useState(false);
    useEffect(() => {
        const onMode = (e: Event) =>
            setEditing((e as CustomEvent<{ mode?: string }>).detail?.mode === 'window');
        window.addEventListener('beam-ux:mode', onMode);
        return () => window.removeEventListener('beam-ux:mode', onMode);
    }, []);
    return editing;
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

    // Read mode: the plain page (correct chrome + styles), no editing overhead.
    if (!editing) {
        return <TreeRender tree={doc} />;
    }

    const save = async () => {
        mount.markSaving(true);
        try {
            await mount.flush();
            await transport.saveBody(slug, doc);
            mount.markDirty(false);
            notify?.success('Saved');
        } catch {
            notify?.error('Save failed');
        } finally {
            mount.markSaving(false);
        }
    };
    const exit = () => window.dispatchEvent(new CustomEvent('beam-ux:exit'));

    return (
        <WidgetRegistryContext.Provider value={registry}>
            <EditShellMountProvider value={mount}>
                <style dangerouslySetInnerHTML={{ __html: veCss(theme) + peCss(theme) }} />

                {/* The content region — IN PLACE (inside the page's layout), so classes + scoped CSS apply. */}
                <CanvasWidget value={doc} onChange={setDoc} editShellMount={mount} theme={theme} />

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
                    <button className="pe-btn primary" onClick={save}>
                        Save
                    </button>
                    <button className="pe-btn" onClick={exit}>
                        Exit
                    </button>
                </div>

                {leftOpen && (
                    <aside className="pe-panel pe-left">
                        <CanvasPalette />
                    </aside>
                )}

                {/* Closed by default; the Inspector button opens it (empty hint until you select
                    something), and selecting an element auto-opens it with that element's properties.
                    frame's own Inspector already renders its own empty state when nothing is selected. */}
                {rightOpen && (
                    <aside className="pe-panel pe-right">
                        <FrameInspector />
                    </aside>
                )}
            </EditShellMountProvider>
        </WidgetRegistryContext.Provider>
    );
}

export default PageEditor;
