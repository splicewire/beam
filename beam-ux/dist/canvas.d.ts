import * as react from 'react';
import react__default, { ComponentType, ReactNode } from 'react';
import { JsonBlock, JsonNode, JsonDoc } from './blockdoc/json.js';
import { E as EntryPublicationState } from './types-1i59E1ZE.js';
import { EditShellMountValue } from '@schemastud/frame';
import { WidgetRegistry } from '@schemastud/seam';
import './types-K1Eu-Q2o.js';
import '@babel/types';
import '@splicewire/beam-resources/types/beam-ux';

/** The MDX island read view — a host-provided component (the package never imports @splicewire/beam-mdx). */
type MdxViewComponent = ComponentType<{
    file?: string;
    md?: string;
}>;
/** The MDX island edit view — in-place mdxeditor, emits the edited body back through `onChange`. */
type MdxEditComponent = ComponentType<{
    file?: string;
    md?: string;
    onChange: (md: string) => void;
}>;
/** An insert-palette entry: a label + a factory producing a fresh JsonBlock to insert. */
interface BlockTemplate {
    label: string;
    make: () => JsonBlock;
}
/** Everything the canvas recursion needs, injected by the host. */
interface CanvasConfig {
    /** PascalCase component map — a tree block whose `name` is a key renders SEALED as this component. */
    registry: Record<string, ComponentType<Record<string, unknown>>>;
    /** The MDX island read component. */
    MdxView: MdxViewComponent;
    /** The MDX island edit component. */
    MdxEdit: MdxEditComponent;
    /** Class-name autocomplete pool for the inspector's class chips. Defaults to a generic set. */
    classSuggestions?: string[];
    /** CSS-value / `var(--…)` autocomplete pool for the inspector's style rows. Defaults to generic. */
    varSuggestions?: string[];
    /** Insert-palette templates. Defaults to a generic HTML block set. */
    blockTemplates?: BlockTemplate[];
    /**
     * Known entitlement-key autocomplete pool for the Inspector's Access section (view/edit gate
     * fields) — so authoring a gate is picking from a list, not guessing a string. A `<datalist>`, not
     * a hard `<select>`: a key not yet in this pool still types in freely (e.g. a bespoke key a host
     * hasn't wired into its can-map yet). Omitted ⇒ no suggestions, plain free-text inputs.
     */
    entitlementKeys?: string[];
    /**
     * The current author's flat entitlement can-map (same shape a host's `CanMapBuilder` already
     * produces for its Inertia `can` prop — `{ [entitlementKey]: boolean }`). Drives per-element EDIT
     * gating: a node whose `data-edit-gate` prop names a key this map doesn't clear renders sealed
     * (same as an opaque/registered-component island). Omitted (or a key absent from the map) means
     * "not entitled" — gating fails closed. View gating (`data-view-gate`) is NOT enforced here — a
     * client-side-only check would still ship the content in the response; the host strips
     * view-gated nodes server-side before the body ever reaches an unentitled viewer.
     */
    can?: Record<string, boolean>;
}
declare function CanvasProvider({ config, children }: {
    config: CanvasConfig;
    children: ReactNode;
}): react.JSX.Element;
/** Read the injected CanvasConfig. Throws if used outside a <CanvasProvider>. */
declare function useCanvas(): CanvasConfig;
/** A registered PascalCase component name renders as a sealed opaque island. */
declare const isIsland: (config: CanvasConfig, name: string | null) => boolean;
/**
 * A node carrying a `data-edit-gate` entitlement key the current author's can-map doesn't clear
 * renders sealed — the same "selectable/movable, not drillable" treatment an opaque/component island
 * gets, just gated on permission instead of source-reachability. A key absent from `can` fails
 * closed (sealed); a host that never injects `can` at all fails OPEN (never seals) — edit-gating
 * isn't a security boundary (the content is already visible in read mode; it only restricts who may
 * change it), so an unconfigured host degrading to "no gating" rather than "everyone locked out" is
 * the safer default. The real security boundary is the server-side view-gate filter.
 */
declare const isEditGated: (config: CanvasConfig, block: JsonBlock) => boolean;

/** Which half of a hovered block's box a drag is over — the mount inserts on that edge. */
type DropEdge = 'before' | 'after';
/**
 * Drag/drop callbacks the canvas raises upward (the mount owns drag state, so multiple sibling
 * CanvasNodes agree on a single source of truth for "what's being dragged, and over which edge").
 */
type Dnd = {
    onDragStart: (path: string) => void;
    /** The drag is hovering `path`, over its top (`before`) or bottom (`after`) half. */
    onDragOverNode: (path: string, edge: DropEdge) => void;
    /**
     * Commit the move at whatever (path, edge) the mount last recorded via `onDragOverNode`. The
     * native `DataTransfer` is passed through (not just relied on via same-tree local state) because
     * a drag can originate OUTSIDE this component tree entirely — e.g. an insert-palette item hosted
     * by a shell region that is a REACT SIBLING of the canvas, not an ancestor/descendant, so it has
     * no shared React state to stash "what's being dragged" in. `null` when the browser doesn't
     * expose one (defensive; real drag events always carry it).
     */
    onDrop: (dataTransfer: DataTransfer | null) => void;
    onDragEnd: () => void;
};
interface CanvasNodeProps {
    node: JsonNode;
    path: string;
    /** The path currently being inline-text-edited, or null. */
    editing: string | null;
    onEditText: (path: string, text: string) => void;
    onEditMd?: (path: string, md: string) => void;
    dnd: Dnd;
}
/** The vertical half of `el`'s box `clientY` falls in — the edge a drop at this cursor position targets. */
declare function edgeAt(el: HTMLElement, clientY: number): DropEdge;
declare function CanvasNode({ node, path, editing, onEditText, onEditMd, dnd }: CanvasNodeProps): react__default.JSX.Element;

/**
 * Render a single node (and its subtree) read-only. Exported so CanvasNode can reuse it for an
 * entitlement-sealed node's content (same "sealed but real" rendering an opaque/component island
 * already gets — just gated on the viewer's can-map instead of source-reachability).
 */
declare function renderNode(node: JsonNode, path: string, config: CanvasConfig): ReactNode;
/** Render a JsonDoc (or a single-root body) read-only through the injected CanvasConfig. */
declare function TreeRender({ tree }: {
    tree: JsonNode | JsonNode[];
}): react.JSX.Element;

interface BreadcrumbProps {
    doc: JsonDoc;
    /** The selected node's path. */
    path: string;
    onSelect: (path: string) => void;
}
declare function Breadcrumb({ doc, path, onSelect }: BreadcrumbProps): react.JSX.Element;

interface ContextMenuAction {
    label: string;
    onSelect?: () => void;
    /** Renders in the "destructive" treatment (Delete). */
    danger?: boolean;
    /** Renders dimmed and non-interactive (e.g. Move Up on the first sibling). */
    disabled?: boolean;
    /** A nested flyout of actions (e.g. Insert's block-type picker), opened on hover. */
    children?: ContextMenuAction[];
}
interface ContextMenuState {
    x: number;
    y: number;
    /** The path this menu was opened for — carried for the caller's convenience, unused internally. */
    path: string;
}
interface ContextMenuProps {
    state: ContextMenuState;
    actions: ContextMenuAction[];
    onClose: () => void;
}
declare function ContextMenu({ state, actions, onClose }: ContextMenuProps): react.JSX.Element;

interface CanvasTheme {
    /** Primary accent (selection outline, active toggles, save button). */
    accent: string;
    /** Accent hover (save button hover). */
    accentHover: string;
    /** Editable-text (contenteditable) outline. */
    editAccent: string;
    /** The canvas surface (the live page background). */
    canvas: string;
    /** Ink / body text on the canvas. */
    ink: string;
    /** Panel (bar / palette / inspector) background. */
    panelBg: string;
    /** Editor root backdrop (behind the panels, in window mode). */
    rootBg: string;
    /** Primary panel text. */
    panelFg: string;
    /** Muted panel text (hints, labels). */
    muted: string;
    /** Font family for body/panel chrome. */
    fontBody: string;
    /** Monospace family for labels + code. */
    fontMono: string;
}
declare const DEFAULT_CANVAS_THEME: CanvasTheme;
/**
 * Selection outline CSS for the currently selected path (shared by both mounts). A single-color ring
 * can vanish against block content that happens to share its hue (a real, reported case: a blue-ish
 * accent against a cyan block background) — layered as two box-shadows instead of one flat `outline`:
 * a thin white ring hugging the content (drawn on top — box-shadow list order is front-to-back, per
 * spec), then the accent ring just beyond it. The white ring separates the accent from ANY content
 * color behind it, so the indicator stays legible regardless of what the selected block's own
 * background happens to be — the same halo technique most editor selection UIs use.
 */
declare const selectionCss: (path: string, accent: string, isComponent?: boolean) => string;
/**
 * Drop-target indicator CSS: a solid line on the hovered block's top (`before`) or bottom (`after`)
 * edge, showing exactly where a drag-reorder will land (shared by both mounts). `!important` beats the
 * hover dashed-outline rule so the indicator stays legible while dragging over an element. Same
 * white-then-accent layering as {@link selectionCss}, for the same reason.
 */
declare const dropIndicatorCss: (path: string, edge: "before" | "after", accent: string) => string;
/** The window-mode composed editor CSS (host `VE_CSS`), theme-parametrized. */
declare function veCss(t?: Partial<CanvasTheme>): string;
/**
 * The in-place page-editor floating-panel CSS (host `PE_CSS`), theme-parametrized.
 *
 * A floating panel stays OPAQUE to its bottom edge. It used to soften that edge with a mask-image on
 * the whole panel, which faded the panel's own background too: over a light page the dark sidebar
 * turned into a grey gradient (beam VR pass 2, every light pageeditor capture). The soft lower edge
 * is now a sticky strip at the scrollport's foot that fades the scrolling CONTENT into the panel
 * colour, so an overflowing panel still does not cut off hard and a short one looks unchanged.
 */
declare function peCss(t?: Partial<CanvasTheme>): string;

interface VisualEditorProps {
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
declare function VisualEditor({ value, onChange, onSave, theme, brand, onUndo, onRedo, canUndo, canRedo, }: VisualEditorProps): react.JSX.Element;

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
interface PageEditorTransport {
    /**
     * Persist the document. The RESPONSE is read, not discarded: a host whose save op answers with a
     * `compileError` (the beam-ux entry envelope does) has stored the body but produced no artifact for
     * a reader, and {@link compileErrorOf} turns that into the same error the publish path reports.
     * Still typed `unknown` — a host is free to answer with anything, including nothing.
     */
    saveBody: (slug: string, body: JsonDoc) => Promise<unknown>;
    loadBody?: (slug: string) => Promise<{
        body?: unknown;
    } | unknown>;
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
interface Notify {
    success: (msg: string) => void;
    error: (msg: string) => void;
}
interface PageEditorProps {
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
/**
 * Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast.
 *
 * Reads the CURRENT mode, not just subsequent changes — see {@link editModeStore}. `false` on the
 * server, where there is no host and no broadcast.
 */
declare function useEditMode(): boolean;
/** Test seam: forget the remembered mode. Nothing in a running app resets it; a suite must. */
declare function __resetEditMode(): void;
declare function PageEditor({ slug, body, transport, notify, theme, fallbackDoc, brand, onUndo, onRedo, canUndo, canRedo, reloadToken, }: PageEditorProps): react.JSX.Element;

/** The `DataTransfer` key a palette drag stashes its template's `nodeType` under — the bridge for a
 * drag that starts in the shell's palette region (a REACT SIBLING of this widget, not an ancestor/
 * descendant) with no shared React state to use instead. See CanvasPalette.tsx (the drag source). */
declare const TEMPLATE_DATA_KEY = "application/x-beam-ux-template";
interface CanvasWidgetProps {
    /** WidgetSurface passes the record as BOTH `value` and `formData`; either is accepted. */
    value?: JsonDoc;
    formData?: JsonDoc;
    onChange?: (doc: JsonDoc) => void;
    editShellMount?: EditShellMountValue;
    readOnly?: boolean;
    /** The host's theme (same object VisualEditor/PageEditor thread into `veCss()`/`peCss()`) — drives
     * the selection/drop-indicator accent color. Defaults to `DEFAULT_CANVAS_THEME.accent` when absent. */
    theme?: Partial<CanvasTheme>;
    /** Suppress the built-in in-flow breadcrumb — for a host that renders {@see Breadcrumb} itself
     * elsewhere (PageEditor puts it in the floating Inspector panel; in-flow here would render behind
     * that same panel, since both sit at the top of the real page's content flow). Default false keeps
     * FiveRegionEditShell/VisualEditor's own docked-region layout, where in-flow is correct, unchanged. */
    hideBreadcrumb?: boolean;
}
declare function CanvasWidget({ value, formData, onChange, editShellMount: mount, readOnly, theme, hideBreadcrumb, }: CanvasWidgetProps): react.JSX.Element;

/** The `x-widget` / `widget` name the canvas registers under — pass this as
 * `<FiveRegionEditShell widget={CANVAS_WIDGET_NAME}>`. */
declare const CANVAS_WIDGET_NAME = "beam-ux-canvas";
declare function createCanvasWidgetRegistry(canvasWidget?: ComponentType<CanvasWidgetProps>): WidgetRegistry;

declare function CanvasPalette(): react.JSX.Element;

/** A minimal JSON Schema node — kept loose, mirroring @schemastud/seam's own `SchemaNode`. */
type SchemaNode = Record<string, unknown>;
interface AttrsSchemaResult {
    schema: SchemaNode;
    attrs: Record<string, string>;
}
/**
 * Build the attrsSchema + attrs formData for the currently-selected block. `entitlementKeys` is the
 * host's known-key pool (same source the old Inspector's `<datalist>` suggestions used) — passed
 * through so the gate fields render a real `<select>`, not a guess-a-string input.
 */
declare function attrsSchemaFor(block: JsonBlock, entitlementKeys?: string[]): AttrsSchemaResult;

/** The RJSF custom-widget contract (mirrors seam's own StarRatingWidget). */
interface RjsfWidgetProps {
    id?: string;
    value?: unknown;
    disabled?: boolean;
    readonly?: boolean;
    onChange: (value: unknown) => void;
}
declare function ClassChipsWidget({ id, value, disabled, readonly, onChange }: RjsfWidgetProps): react.JSX.Element;
declare function StyleRowsWidget({ id, value, disabled, readonly, onChange }: RjsfWidgetProps): react.JSX.Element;

/** Generic insert-palette templates (plain HTML vocabulary). A host may replace via CanvasConfig. */
declare const DEFAULT_BLOCK_TEMPLATES: BlockTemplate[];
/** Generic Tailwind-flavored class autocomplete pool. */
declare const DEFAULT_CLASS_SUGGESTIONS: string[];
/** Generic CSS-var autocomplete pool. */
declare const DEFAULT_VAR_SUGGESTIONS: string[];

/** The reserved prop names carrying a node's per-element entitlement gates (an entitlement key string
 * each, e.g. `ux.author` or a host-registered bespoke key). See {@link CanvasConfig.can} (edit gate)
 * and the host's server-side body filter (view gate) for how each is actually enforced. */
declare const VIEW_GATE_ATTR = "data-view-gate";
declare const EDIT_GATE_ATTR = "data-edit-gate";
/** Props whose editing lives OUTSIDE the "other attributes" list (className/style edited specially; md
 * is the MDX island body, edited in the canvas; the two gate attrs get their own Inspector section).
 * Mirrors the host's `class`/`style`/`md` exclusion. */
declare const RESERVED_ATTRS: Set<string>;
/** The node's edit-gate entitlement key, or null when ungated. */
declare const editGateOf: (block: JsonBlock) => string | null;
/** The node's view-gate entitlement key, or null when ungated. */
declare const viewGateOf: (block: JsonBlock) => string | null;
/**
 * Map a JsonBlock's props into React element props (mirror host `attrsToProps`):
 *   className prop → className; style prop (string) → parseStyle; other scalar props → their value;
 *   expression-kind props are skipped (they can't render on an intrinsic element).
 */
declare function blockToProps(block: JsonBlock): Record<string, unknown>;
/** Scalar props for an opaque-island component: a plain object of string/number/boolean prop values. */
declare function islandProps(block: JsonBlock): Record<string, unknown>;
/** The `Record<string,string>` attribute view the Inspector reads/writes (string-kind props only). */
declare function attrsView(block: JsonBlock): Record<string, string>;
/** Read a leaf block's text content (the concatenated text children). */
declare const blockText: (block: JsonBlock) => string;
/**
 * Apply an attribute patch (the Inspector's `Record<string,string|undefined>` shape) back onto a block as
 * string-kind prop set/remove ops. `undefined` removes the prop. Reads the current attr view to compute
 * the diff so removals of no-longer-present keys drop cleanly.
 */
declare function applyAttrs(block: JsonBlock, patch: Record<string, string | undefined>): JsonBlock;
/**
 * Replace a block's full string-attr set from a `Record<string,string>` (the shape the host Inspector's
 * `onAttrs` emits). Non-string props (expression/etc.) are preserved; every string-kind prop is rebuilt
 * from `attrs`, so a key dropped from `attrs` is removed.
 */
declare function setAttrs(block: JsonBlock, attrs: Record<string, string>): JsonBlock;

/**
 * Insert a fresh block relative to the current selection. When the target is the root container (path
 * "0") and not a leaf, the block is appended INSIDE it; otherwise it lands as the selection's next sibling.
 *
 * **An EMPTY doc appends at the root array**, which is the case this used to refuse. Measured on
 * beam.test 2026-09-11 (G2-BEAM-AUTHOR-EMPTY-ENTRY): on the never-authored `/about` entry the palette's
 * "+ Heading" flipped the status bar to "Unsaved" and inserted nothing — `getAt([], '0')` is null, so
 * the guard below returned the doc unchanged and the author's first block was unperformable. A document
 * with no root is exactly the document that most needs its first block; refusing there is the one place
 * the "insert relative to something" model has nothing to be relative TO, and the honest answer is the
 * root array itself (`insertInto(doc, '', …)`).
 *
 * The guard is still right for its other case — a selection pointing at a node that no longer exists, on
 * a NON-empty doc, falls back to the root path "0" and inserts inside it as before.
 */
declare function insertRelativeTo(doc: JsonDoc, selectedPath: string | null, make: () => JsonBlock): JsonDoc;

/** The entry formats whose codec can carry a JsonDoc. Extend only alongside a PHP `AcceptsJsonDoc`. */
declare const CANVAS_FORMATS: readonly string[];
/**
 * May the canvas open an entry of this format?
 *
 * `null`/`undefined` is **unknown**, not "any", and answers `false`: the two ref branches that cannot
 * carry a format (`?beam_entry=<slug>` and the component-name guess) would otherwise re-open exactly
 * the hole this closes. A host that genuinely knows its pages are tsx supplies the format rather than
 * relying on a permissive default.
 */
declare function canvasAcceptsFormat(format: string | null | undefined): boolean;
/** Why the canvas declined — a sentence for the author, naming the format and what to do instead. */
declare function canvasRefusalFor(format: string | null | undefined): string;

export { type AttrsSchemaResult, type BlockTemplate, Breadcrumb, type BreadcrumbProps, CANVAS_FORMATS, CANVAS_WIDGET_NAME, type CanvasConfig, CanvasNode, type CanvasNodeProps, CanvasPalette, CanvasProvider, type CanvasTheme, CanvasWidget, type CanvasWidgetProps, ClassChipsWidget, ContextMenu, type ContextMenuAction, type ContextMenuProps, type ContextMenuState, DEFAULT_BLOCK_TEMPLATES, DEFAULT_CANVAS_THEME, DEFAULT_CLASS_SUGGESTIONS, DEFAULT_VAR_SUGGESTIONS, type Dnd, type DropEdge, EDIT_GATE_ATTR, type MdxEditComponent, type MdxViewComponent, type Notify, PageEditor, type PageEditorProps, type PageEditorTransport, RESERVED_ATTRS, type SchemaNode, StyleRowsWidget, TEMPLATE_DATA_KEY, TreeRender, VIEW_GATE_ATTR, VisualEditor, type VisualEditorProps, __resetEditMode, applyAttrs, attrsSchemaFor, attrsView, blockText, blockToProps, canvasAcceptsFormat, canvasRefusalFor, createCanvasWidgetRegistry, dropIndicatorCss, edgeAt, editGateOf, insertRelativeTo, isEditGated, isIsland, islandProps, peCss, renderNode, selectionCss, setAttrs, useCanvas, useEditMode, veCss, viewGateOf };
