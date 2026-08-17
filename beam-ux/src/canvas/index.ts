/**
 * `@splicewire/beam-ux/canvas` — the portable, in-place visual editor promoted from the audiostud host
 * (editor-promotion tickets 02+03). A Webflow-grade editor over a single-root `JsonDoc` body (the AST-free
 * tree from `@splicewire/beam-ux/blockdoc/json`): click to select, double-click text to edit inline, drag
 * to reorder, an Insert palette to add blocks, and an OS-styled Inspector (classes · CSS + vars · attrs).
 *
 * Everything app-specific is INJECTED via {@link CanvasConfig} through a {@link CanvasProvider} — the
 * component registry (opaque islands), the MDX island view/edit components, the insert templates, and the
 * class/var suggestion pools. Theme is parametrized via {@link veCss}/{@link peCss} tokens. The package is
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
export { Inspector } from './Inspector.js';
export type { InspectorProps } from './Inspector.js';
export { Breadcrumb } from './Breadcrumb.js';
export type { BreadcrumbProps } from './Breadcrumb.js';
export { ContextMenu } from './ContextMenu.js';
export type { ContextMenuProps, ContextMenuAction, ContextMenuState } from './ContextMenu.js';
export { VisualEditor } from './VisualEditor.js';
export type { VisualEditorProps } from './VisualEditor.js';
export { PageEditor, useEditMode } from './PageEditor.js';
export type { PageEditorProps, PageEditorTransport, Notify } from './PageEditor.js';

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
