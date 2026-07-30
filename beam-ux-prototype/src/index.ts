// @splicewire/beam-ux-prototype — the repo-agnostic runtime for the rushing-prototype UX system
// (Beam free-tier arm; ADR-0116 rehome-ui). A host prototypes UX the way splicewire does: real
// components rendered read-only over colocated fixtures, auto-mounted at `/_prototype/<slug>`,
// fenced from production. The one load-bearing seam — `import.meta.glob`, a Vite compile-time
// macro — stays at the host call site; everything around it lives here.

// The glob→route mount utility (ticket 01) — the hardest export, the one that must stay paired
// with the host's compile-time glob.
export {
    createPrototypeRoutes,
    type PrototypeGlob,
    type CreatePrototypeRoutesOptions,
} from './createPrototypeRoutes';

// The bundled default class-name merge (overridable via the chrome injection points).
export { cn, type Cn, type ClassValue } from './cn';

// Generic shapes the packaged chrome types its props off (the splicewire nav DATA stays host-owned).
export type { NavItem, NavGroup, NavTab, VariantSpec, IconComponent } from './types';

// The generic, brand-free prototyping chrome (ticket 03). `Gallery` is auto-mounted by
// `createPrototypeRoutes`; `VariantBar` + `SettingsFrame` are imported by prototypes/host wrappers.
export { Gallery, type GalleryProps } from './Gallery';
export { VariantBar, type VariantBarProps } from './VariantBar';
export { SettingsFrame, type SettingsFrameProps } from './SettingsFrame';
// The desk shell (ticket 04) — brand + nav injected, host CSS tokens referenced by classname.
export { PrototypeDesk, Crumb, type PrototypeDeskProps } from './PrototypeDesk';
