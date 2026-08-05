// @splicewire/beam-ux/puck — the structural (Puck) front-end page editor, a separate entry from the
// base package so the heavy `@measured/puck` dependency loads only for a host that composes pages
// structurally (mirrors beam-mdx's `/editor` split). The host injects its block vocabulary as a Puck
// `config`; the load/edit/publish/render machinery + Data normalization travel with the package.
export {
    PuckPage,
    PuckPageRender,
    isPuckData,
    normalizePuckData,
    type PuckPageProps,
    type PuckPageRenderProps,
} from './PuckPage';

// The config/seed registry (beam-ux-uplift ticket 05) — a host registers its block vocabularies keyed by
// realm/slug and a mount resolves the matching `{config, seed}` pair, so the pairing can't drift.
export {
    createPuckRegistry,
    resolvePuck,
    type PuckRegistry,
    type PuckVocabulary,
} from './PuckRegistry';
