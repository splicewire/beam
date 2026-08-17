/**
 * `@splicewire/beam-ux/canvas` — the portable, in-place visual editor promoted from the audiostud host
 * (editor-promotion tickets 02+03). A Webflow-grade editor over a single-root `JsonDoc` body (the AST-free
 * tree from `@splicewire/beam-ux/blockdoc/json`): click to select, double-click text to edit inline, drag
 * to reorder (from the canvas OR from the Insert palette), a breadcrumb + right-click menu, and an
 * entitlement-gated seal for per-element access control.
 *
 * Attrs editing (classes / style / access gates / arbitrary attributes) is `@schemastud/frame`'s own
 * schema-driven `Inspector` — a JsonBlock's editable props are projected to a JSON Schema
 * ({@link attrsSchemaFor}) with two custom widgets ({@link ClassChipsWidget}, {@link StyleRowsWidget})
 * preserving the chip/row UX; `FiveRegionEditShell` (window mode, `VisualEditor`) and a locally-built
 * `EditShellMount` (in-place mode, `PageEditor`) both drive the SAME Inspector off the SAME
 * `CanvasWidget` (registered as a heavyweight widget in window mode, mounted directly in in-place mode)
 * — one canvas implementation, one attrs-editing implementation, two host chromes.
 *
 * Everything ELSE app-specific is still INJECTED via {@link CanvasConfig} through a {@link CanvasProvider}
 * — the component registry (opaque islands), the MDX island view/edit components, the insert templates,
 * the class/var/entitlement-key suggestion pools. Theme is parametrized via {@link veCss}/{@link peCss}
 * tokens (the canvas region's own styling; the shell's OUTER chrome in window mode rides
 * `@schemastud/frame`'s `--stud-*` tokens instead — a host bridges those separately). The package is
 * Babel-free: it imports ONLY the JSON tree ops, never the recast/@babel lens.
 */

// Context + injection
export {
    CanvasProvider,
    useCanvas,
    isIsland,
    isEditGated,
} from './context.js';
export type {
    CanvasConfig,
    BlockTemplate,
    MdxViewComponent,
    MdxEditComponent,
} from './context.js';

// The editor surfaces
export { CanvasNode, edgeAt } from './CanvasNode.js';
export type { CanvasNodeProps, Dnd, DropEdge } from './CanvasNode.js';
export { TreeRender, renderNode } from './TreeRender.js';
export { Breadcrumb } from './Breadcrumb.js';
export type { BreadcrumbProps } from './Breadcrumb.js';
export { ContextMenu } from './ContextMenu.js';
export type { ContextMenuProps, ContextMenuAction, ContextMenuState } from './ContextMenu.js';
export { VisualEditor } from './VisualEditor.js';
export type { VisualEditorProps } from './VisualEditor.js';
export { PageEditor, useEditMode } from './PageEditor.js';
export type { PageEditorProps, PageEditorTransport, Notify } from './PageEditor.js';

// The heavyweight widget adapter + its @schemastud/frame registration (window-mode mounting; PageEditor
// mounts CanvasWidget directly, no registry needed there).
export { CanvasWidget, TEMPLATE_DATA_KEY } from './CanvasWidget.js';
export type { CanvasWidgetProps } from './CanvasWidget.js';
export { CANVAS_WIDGET_NAME, createCanvasWidgetRegistry } from './widgetRegistry.js';
export { CanvasPalette } from './CanvasPalette.js';

// attrsSchema — the JsonBlock -> JSON Schema translation frame's Inspector renders, + its two custom
// RJSF widgets (register these yourself if you build your own WidgetRegistry instead of using
// createCanvasWidgetRegistry()).
export { attrsSchemaFor } from './attrsSchema.js';
export type { AttrsSchemaResult, SchemaNode } from './attrsSchema.js';
export { ClassChipsWidget, StyleRowsWidget } from './widgets.js';

// Theme + CSS factories
export { veCss, peCss, selectionCss, dropIndicatorCss, DEFAULT_CANVAS_THEME } from './css.js';
export type { CanvasTheme } from './css.js';

// Generic defaults (host-overridable)
export {
    DEFAULT_BLOCK_TEMPLATES,
    DEFAULT_CLASS_SUGGESTIONS,
    DEFAULT_VAR_SUGGESTIONS,
} from './templates.js';

// Prop / attribute helpers
export {
    blockToProps,
    islandProps,
    attrsView,
    applyAttrs,
    setAttrs,
    blockText,
    RESERVED_ATTRS,
    VIEW_GATE_ATTR,
    EDIT_GATE_ATTR,
    editGateOf,
    viewGateOf,
} from './props.js';

// Insert placement
export { insertRelativeTo } from './insert.js';
