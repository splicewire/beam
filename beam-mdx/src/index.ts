// =============================================================================
// @splicewire/beam-mdx — the file-driven MDX content rung.
//
// The browser surface: the content resolver, the cross-property citation kit (Ref /
// Receipts), the frontmatter-driven JSON-LD builder, the embed-by-reference <Content>,
// and the parameterized <ContentShow> renderer. The node-side build plugin + MDX preset
// live at `@splicewire/beam-mdx/vite`; the base typography at `@splicewire/beam-mdx/css`.
// A consuming satellite keeps only its own references manifest and brand tokens.
// =============================================================================

// Content resolver + types.
export { createContent, isDraft, DEFAULT_DRAFTABLE_PREFIXES } from './content';

// Frontmatter → nav-node mapping (feeds a @schemastud/nav sidebar/breadcrumb).
export { contentNavNodes } from './nav';
export type { ContentNavNode, ContentNavOptions } from './nav';
export type {
    ContentApi,
    ContentLayout,
    ContentFrontmatter,
    ContentModule,
    RawContentModule,
    RawContentModules,
    BroadcastPlatform,
    EssayListItem,
    EssayTopic,
    BroadcastListItem,
} from './content';

// Cross-property citation kit (types + pure resolver; the manifest stays satellite-side).
export { resolveReference } from './references';
export type {
    Reference,
    ReferenceKind,
    ResolvedReference,
    LinksConfig,
} from './references';

// Injection seam for the MDX render surface.
export { BeamMdxProvider, useBeamMdx, useLinks } from './context';
export type { BeamMdxContextValue } from './context';

// Runtime MDX compile/render + the content-delivery client — for content delivered after the
// bundle (generic; no gate, no "guide"). RuntimeMdx takes an MDX string; RemoteMdx fetches a URL
// (transport overridable via `fetcher`) and renders it through RuntimeMdx.
export { RuntimeMdx, RemoteMdx, compileMdx, fetchMdx } from './runtime/runtime-mdx';
export type { RuntimeMdxProps, RemoteMdxProps, RuntimeMdxOptions, MdxComponentMap } from './runtime/runtime-mdx';

// Authoring primitives — the write-side twin of the runtime render path. The MdxEditor (buffer +
// live RuntimeMdx preview), frontmatter split/rejoin, and a caller-supplied-URL save/load transport.
// Generic: no route, gate, tenant, or "docs" knowledge; the app injects the resolved URL + CSRF.
export { MdxEditor } from './runtime/mdx-editor';
export type { MdxEditorProps } from './runtime/mdx-editor';
export {
    parseFrontmatter,
    serializeMdx,
    serializeFrontmatter,
    loadRawMdx,
    saveMdx,
    putMdx,
} from './runtime/authoring';
export type { MdxFrontmatter, ParsedMdx, MdxLoader, MdxSaver } from './runtime/authoring';

// Render surface.
export { Ref, Receipts } from './components/reference';
export { Content } from './components/content';
export { JsonLd, contentJsonLd } from './components/json-ld';
export type { JsonLdNode } from './components/json-ld';
export { ContentShow } from './components/content-show';
export type { ContentShowProps, ContentLayouts } from './components/content-show';
