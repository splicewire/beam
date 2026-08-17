// The composed window-mode editor (controlled): FiveRegionEditShell (@schemastud/frame) owns the
// chrome — top bar / palette / canvas / inspector / status — with the canvas block-tree editing
// mounted as a registered heavyweight widget (CanvasWidget). `value`/`onChange` still carry the body
// so a host persists it; the external prop contract is UNCHANGED from the hand-rolled predecessor, so
// a host mount site doesn't need to change just because the internals now ride the shell.
//
// FiveRegionEditShell/WidgetSurface never forward an `onChange` to the mounted widget (it's built for
// a self-persisting widget, not a controlled one) — CanvasWidgetBound below bridges that: a STABLE
// wrapper component (registered once, `useMemo(..., [])`) that reads the live onChange off a ref
// updated every render. Stable identity matters — a registry recreated on every `value` change (i.e.
// every edit) would make React see a brand-new widget TYPE at that position and remount it, losing
// all local canvas state (text-edit focus, drag state, the open context menu) on every keystroke.
import { useMemo, useRef } from 'react';
import { FiveRegionEditShell, useEditShellMount } from '@schemastud/frame';
import { CanvasPalette } from './CanvasPalette.js';
import { CanvasWidget } from './CanvasWidget.js';
import { veCss } from './css.js';
import type { CanvasTheme } from './css.js';
import { CANVAS_WIDGET_NAME, createCanvasWidgetRegistry } from './widgetRegistry.js';
import type { JsonDoc } from '../blockdoc/json.js';

export interface VisualEditorProps {
    /** The body — a single-root JsonDoc. */
    value: JsonDoc;
    onChange: (doc: JsonDoc) => void;
    onSave?: () => void | Promise<void>;
    /**
     * Still used — FiveRegionEditShell owns the outer chrome (top bar / palette / inspector layout,
     * via `--stud-*` tokens) but the canvas region's OWN styling (selection/drop-indicator outlines,
     * class chips, style rows, the breadcrumb, the context menu, sealed-node badges) is still these
     * theme-parametrized `veCss()` rules — unrelated to the shell's token system.
     */
    theme?: Partial<CanvasTheme>;
    /** Brand label shown in the top bar (host-supplied). Defaults to a generic label. */
    brand?: string;
    /**
     * Undo/redo — entirely host-injected (the package stays version-blind, ADR-0116 four-kind seam).
     * A host typically backs these with its own version-history mechanism (e.g.
     * `@splicewire/beam-versioning`'s `useRestoreVersion`). Buttons render only when supplied.
     */
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

/** A JsonDoc has no formal JSON-Schema grammar (yet) — this is inert. `resolveWidgetFor` forces the
 * `x-widget` regardless of what's here (the `widget` prop below wins), so its OTHER fields never
 * actually drive anything; it exists only because FiveRegionEditShell requires a `schema` prop. */
const INERT_SCHEMA = { type: 'array', items: { type: 'object' } };

export function VisualEditor({
    value,
    onChange,
    onSave,
    theme,
    brand = 'visual editor',
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
}: VisualEditorProps) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Created once per mount (empty deps) — see the file docblock for why identity must stay stable.
    // `props.value`/`props.formData` still flow through normally (WidgetSurface passes the shell's
    // live `record`), so only the onChange callback needs this ref bridge, not the value itself.
    const registry = useMemo(
        () =>
            createCanvasWidgetRegistry((props) => (
                <CanvasWidget {...props} onChange={(doc) => onChangeRef.current(doc)} />
            )),
        [],
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: veCss(theme) }} />
            <FiveRegionEditShell
                schema={INERT_SCHEMA}
                record={value as unknown as Record<string, unknown>}
                widget={CANVAS_WIDGET_NAME}
                registry={registry}
                // Own Save button (below, in topBar) instead of the shell's default — ours can reach
                // the mount to flush + markDirty(false), which the shell's default autosave=false
                // button (outside the provider from this component's own scope) has no way to do.
                autosave
                topBar={
                    <TopBarExtras
                        brand={brand}
                        onSave={onSave}
                        onUndo={onUndo}
                        onRedo={onRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                }
                palette={<CanvasPalette />}
            />
        </>
    );
}

function TopBarExtras({
    brand,
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}: {
    brand: string;
    onSave?: () => void | Promise<void>;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo: boolean;
    canRedo: boolean;
}) {
    const mount = useEditShellMount();

    const save = async () => {
        if (!onSave) return;
        mount.markSaving(true);
        try {
            await mount.flush();
            await onSave();
            mount.markDirty(false);
        } finally {
            mount.markSaving(false);
        }
    };

    return (
        <>
            <span className="ve-brand">
                <span className="ve-mark" />
                {brand}
            </span>
            <span className="ve-hint">
                click = select · double-click text = edit · drag = reorder · right-click = actions
            </span>
            <span className="ve-spacer" />
            {(onUndo || onRedo) && (
                <>
                    <button type="button" className="ve-toggle" onClick={onUndo} disabled={!canUndo} title="Undo">
                        ↶ Undo
                    </button>
                    <button type="button" className="ve-toggle" onClick={onRedo} disabled={!canRedo} title="Redo">
                        ↷ Redo
                    </button>
                </>
            )}
            {onSave && (
                <button type="button" className="ve-toggle ve-save" onClick={save}>
                    Save
                </button>
            )}
        </>
    );
}
