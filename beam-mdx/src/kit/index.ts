// =============================================================================
// @splicewire/beam-mdx/kit — Tier-1 guide-doc React components.
//
// The presentation layer for guide/doc MDX (ADR-0096, a scoped ADR-0092 exception):
// framed figures, file trees, terminal chrome, admonitions, and stepped procedures.
// Every component is presentational and side-effect-free; all styling rides the
// `.bkit-*` classes in `@splicewire/beam-mdx/kit/css`, which read the host's `--sr-*` /
// `--swc-*` token vars. No colors hard-coded, no dependencies beyond React (a peer).
// =============================================================================

export { Figure } from './figure';
export { FileTree } from './file-tree';
export type { FileTreeNode } from './file-tree';
export { Terminal } from './terminal';
export { Callout } from './callout';
export type { CalloutType } from './callout';
export { Steps, Step } from './steps';
export { DoctorOutput, parseDoctorOutput } from './doctor-output';
export type { DoctorFinding } from './doctor-output';

// Nav-source registry seam (compose-many) + the shared sidebar tree builder.
export {
    registerNavSource,
    getNavSources,
    clearNavSources,
    resolveNavNodes,
    buildNavTree,
} from './nav-registry';
export type {
    NavNode,
    NavSource,
    NavGroup,
    NavTrack,
} from './nav-registry';

// Section-landing pattern: hero + responsive card grid of full-card links.
export { SectionLanding, CardGrid, Card } from './section-landing';
