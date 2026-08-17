// `@splicewire/beam-ux/canvas` — the CanvasConfig context.
//
// The visual editor recursion (CanvasNode / TreeRender / Inspector) is tenancy-agnostic: everything
// app-specific — the component registry for opaque islands, the MDX island view/edit components, the
// insert-palette templates, and the class/var suggestion pools — is INJECTED here, never imported.
// A host wraps the editor in <CanvasProvider config={…}> and the machinery reads it via useCanvas().
import { createContext, useContext } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { JsonBlock } from '../blockdoc/json.js';
import { editGateOf } from './props.js';

/** The MDX island read view — a host-provided component (the package never imports @splicewire/beam-mdx). */
export type MdxViewComponent = ComponentType<{ file?: string; md?: string }>;

/** The MDX island edit view — in-place mdxeditor, emits the edited body back through `onChange`. */
export type MdxEditComponent = ComponentType<{
    file?: string;
    md?: string;
    onChange: (md: string) => void;
}>;

/** An insert-palette entry: a label + a factory producing a fresh JsonBlock to insert. */
export interface BlockTemplate {
    label: string;
    make: () => JsonBlock;
}

/** Everything the canvas recursion needs, injected by the host. */
export interface CanvasConfig {
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

const CanvasContext = createContext<CanvasConfig | null>(null);

export function CanvasProvider({ config, children }: { config: CanvasConfig; children: ReactNode }) {
    return <CanvasContext.Provider value={config}>{children}</CanvasContext.Provider>;
}

/** Read the injected CanvasConfig. Throws if used outside a <CanvasProvider>. */
export function useCanvas(): CanvasConfig {
    const ctx = useContext(CanvasContext);
    if (!ctx) throw new Error('useCanvas() must be used within a <CanvasProvider>.');
    return ctx;
}

/** A registered PascalCase component name renders as a sealed opaque island. */
export const isIsland = (config: CanvasConfig, name: string | null): boolean =>
    name !== null && Object.prototype.hasOwnProperty.call(config.registry, name);

/**
 * A node carrying a `data-edit-gate` entitlement key the current author's can-map doesn't clear
 * renders sealed — the same "selectable/movable, not drillable" treatment an opaque/component island
 * gets, just gated on permission instead of source-reachability. A key absent from `can` fails
 * closed (sealed); a host that never injects `can` at all fails OPEN (never seals) — edit-gating
 * isn't a security boundary (the content is already visible in read mode; it only restricts who may
 * change it), so an unconfigured host degrading to "no gating" rather than "everyone locked out" is
 * the safer default. The real security boundary is the server-side view-gate filter.
 */
export const isEditGated = (config: CanvasConfig, block: JsonBlock): boolean => {
    const key = editGateOf(block);
    return key !== null && config.can !== undefined && !config.can[key];
};
