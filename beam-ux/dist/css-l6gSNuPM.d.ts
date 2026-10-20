import * as react from 'react';
import { ComponentType, ReactNode } from 'react';
import { S as StyleRegistry } from './style-runtime-CugOvocy.js';
import { d as JsonBlock } from './json-BGmPsDn-.js';
import { BlockdocManifest } from '@schemastud/blockdoc';

type BindingRecord = Record<string, unknown>;
interface RepeatRecords {
    records: BindingRecord[];
    hasMore: boolean;
    page: number;
}
type BindingPayload = Record<string, RepeatRecords>;

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
    bindings?: BindingPayload;
    styleRegistry?: StyleRegistry;
    /** Resolved by the server for the entry; the save guard reads this same profile. */
    profile?: BlockdocManifest;
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

export { type BindingRecord as B, type CanvasConfig as C, DEFAULT_CANVAS_THEME as D, type MdxEditComponent as M, type CanvasTheme as a, type BlockTemplate as b, CanvasProvider as c, type MdxViewComponent as d, dropIndicatorCss as e, isIsland as f, isEditGated as i, peCss as p, selectionCss as s, useCanvas as u, veCss as v };
