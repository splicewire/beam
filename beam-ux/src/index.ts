// @splicewire/beam-ux — the beam UX-builder surfaces, authored pre-packaged and DTO-first
// (rehome-ui; ADR-0116). Mirrors PHP `splicewire/laravel-beam-ux`.
//
// A host renders the surfaces by supplying ONE transport adapter (+ optional feedback) through
// <UxBuilderProvider>; everything else — the react-query data logic, the DTO typing off the
// generated projection, the presentation — travels inside the package.

// The generated DTO projection (rehome-ui), delivered via @splicewire/_resources.
export type { BeamUxEntryBodyData } from '@splicewire/_resources/types/beam-ux';

// The injection seams: the provider carrying the transport client + feedback, and the react-query
// data layer that rides on top of it.
export { UxBuilderProvider, useUxBuilderServices, useNotify } from './provider';
export { useEntryBody, useSaveEntryBody } from './hooks';
export type {
    UxBuilderClient,
    UxBuilderServices,
    NotifyEvent,
    Region,
    RegionKind,
    TreeNode,
    PaletteItem,
} from './types';

// Surface components — the docked inspector, the floating overlay, the live canvas, the composition
// structure panel, and the root that composes them.
export { RegionInspector, type RegionEditorProps } from './RegionInspector';
export { RegionOverlay } from './RegionOverlay';
export { RegionCanvas, RegionBlock } from './RegionCanvas';
export { StructurePanel } from './StructurePanel';
export {
    UxBuilder,
    placementFor,
    type BuilderMode,
    type EditorPlacement,
} from './UxBuilder';
