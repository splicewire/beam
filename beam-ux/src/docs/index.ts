/**
 * Generic entry chrome: layout/template registry, artifact-backed chrome, reading templates and
 * host configuration. Documentation layout and Scalar reference live in @splicewire/beam-docs;
 * that optional package registers them explicitly through configureDocs().
 *
 * The Inertia entry page remains at @splicewire/beam-ux/pages. None of this module requires docs.
 */

export { ArtifactChrome, type ArtifactChromeProps } from './ArtifactChrome.js';
export { ProseTemplate, SpreadTemplate } from './templates.js';
export {
    registerChrome,
    registerLayout,
    registerTemplate,
    resolveLayout,
    resolveTemplate,
    registeredChromeNames,
    clearChromeRegistry,
} from './registry.js';
export { configureEntryPage, entryPageConfig, resetEntryPageConfig, type EntryPageConfig } from './config.js';
export { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
export { DOCS_TEMPLATE_CSS } from './css.js';
export type {
    ChromeComponent,
    ChromeProps,
    ChromeSlots,
    EntryPayload,
    EntryArtifactPayload,
    ChromeArtifactsPayload,
} from './types.js';
