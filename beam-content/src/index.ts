// @splicewire/beam-content — bespoke blockdoc NodeViews for the composition `content` profile's
// block vocabulary (component-seams; content-node seam). They replace blockdoc's generic
// BlockChromeFallback so custom content blocks render as clean inline WYSIWYG in the shared
// @schemastud/blockdoc editor. Headless + host-agnostic: the host registers them on its
// nodeViewRegistry via registerContentNodeViews.

export { ContentSectionNodeView } from './ContentSectionNodeView';
export { ContentOutlineNodeView } from './ContentOutlineNodeView';
export { registerContentNodeViews } from './registry';
