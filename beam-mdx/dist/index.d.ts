import * as react from 'react';
import { ComponentType, ReactNode, ReactElement } from 'react';
import { PluggableList } from 'unified';

type ContentLayout = 'site' | 'app' | 'bare';
/** One platform's ledger metadata on a broadcast (Facebook cut, LinkedIn cut, …). */
interface BroadcastPlatform {
    name: string;
    postedAt?: string;
    permalink?: string;
}
interface ContentFrontmatter {
    title: string;
    layout: ContentLayout;
    excerpt?: string;
    navGroup?: string;
    schemaType?: string;
    schemaName?: string;
    datePublished?: string;
    draft?: boolean;
    topic?: string;
    readingTime?: string;
    thread?: string;
    stage?: string;
    targetQuery?: string;
    audience?: string[];
    references?: string[];
    platforms?: BroadcastPlatform[];
}
interface ContentModule {
    Component: ComponentType<Record<string, unknown>>;
    frontmatter: ContentFrontmatter;
}
/** The raw per-file shape the Vite plugin's generated module map hands over. */
interface RawContentModule {
    default: ComponentType<Record<string, unknown>>;
    frontmatter?: Record<string, unknown>;
}
type RawContentModules = Record<string, RawContentModule>;
/**
 * Content-name prefixes gated by a published date — the draft convention's dated types.
 * Must match `draftablePrefixes` given to the Vite plugin and the PHP route gate; all
 * three agree on which prefixes a missing `datePublished` marks as a draft.
 */
declare const DEFAULT_DRAFTABLE_PREFIXES: string[];
/**
 * Is this content a draft? A file under a dated content type (essays, broadcasts) is a
 * draft when it carries no `datePublished`, or when it sets `draft: true`. This is the
 * single render-side source of truth: the /essays list, the home writing log, and the show
 * page all call it, so the Draft badge and the listing can never disagree. The Vite plugin
 * (build-time bundle exclusion) and the PHP route gate are its cross-runtime twins.
 */
declare function isDraft(name: string, frontmatter: Pick<ContentFrontmatter, 'draft' | 'datePublished'>, draftablePrefixes?: string[]): boolean;
interface EssayListItem {
    slug: string;
    name: string;
    title: string;
    excerpt?: string;
    datePublished?: string;
    draft?: boolean;
    topic?: string;
    readingTime?: string;
    thread?: string;
    stage?: string;
    targetQuery?: string;
    audience?: string[];
}
interface EssayTopic {
    topic: string;
    slug: string;
    count: number;
}
interface BroadcastListItem {
    slug: string;
    name: string;
    title: string;
    excerpt?: string;
    platforms?: BroadcastPlatform[];
}
interface ContentApi {
    /** Resolve an authored content file by name (its path under content/, sans .mdx). */
    resolveContent(name: string): ContentModule | undefined;
    /** Every authored content name — used by tests/tooling, not the render path. */
    contentNames(): string[];
    /** Every essay under content/essays, newest first (optionally filtered by topic). */
    essaysList(topic?: string): EssayListItem[];
    /** Distinct essay topics with counts, most-written first (ties alphabetical). */
    essayTopics(): EssayTopic[];
    /** Every broadcast under content/broadcasts (preview-only; empty in prod builds). */
    broadcastsList(): BroadcastListItem[];
}
/**
 * Bind the content resolver to a generated module map. The satellite passes the map from
 * its `virtual:beam-mdx/content` import (provided by the `beamMdxContent` Vite plugin),
 * keeping the virtual import in the app — where Vite owns it — rather than inside this
 * package. The map has already *omitted drafts* in non-preview builds, so the resolver only
 * ever sees what should ship; draft exclusion happens at the graph, not here.
 */
declare function createContent(modules: RawContentModules, draftablePrefixes?: string[]): ContentApi;

/** A flat nav node (structurally @schemastud/nav's NavNode). */
type ContentNavNode = {
    title: string;
    href?: string;
    group?: string;
    track?: string;
    parent?: string;
    order?: number;
    groupOrder?: number;
};
type ContentNavOptions = {
    /** Derive a node's top-level track key from its content name (e.g. folder → track). */
    trackOf: (name: string) => string | undefined;
    /** Build a node's href from its content name (default: `/{name}`). */
    hrefOf?: (name: string) => string;
    /** Keep only names for which this returns true (default: all). */
    filter?: (name: string) => boolean;
    /** Group label for a guide with no `navGroup` (default: leave unset). */
    defaultGroup?: string;
};
/**
 * Map a compiled content module map (name → { frontmatter }) to flat nav nodes, one per
 * guide whose `trackOf` resolves (and that passes `filter`). The nav frontmatter
 * (navGroup/navOrder/navGroupOrder/navParent) is read straight off the raw frontmatter —
 * `createContent` intentionally drops those non-render keys, so this reads the map itself.
 */
declare function contentNavNodes(modules: RawContentModules, opts: ContentNavOptions): ContentNavNode[];

type ReferenceKind = 'guide' | 'story' | 'insight';
interface Reference {
    key: string;
    site: string;
    path: string;
    kind: ReferenceKind;
    title: string;
    summary?: string;
    derivedFrom?: string;
    status: 'live' | 'pending';
}
/** The env-driven base-URL map (site key → absolute base), from the satellite's props. */
type LinksConfig = Record<string, string>;
interface ResolvedReference extends Reference {
    href: string;
}
/**
 * Resolve a cite key against a manifest and the injected `links` config. Returns undefined
 * for an unknown key or a key whose `site` isn't in the links registry (an authoring/config
 * mistake, surfaced by the caller). The base comes from `links`, so the URL is correct
 * per-environment without touching the manifest.
 */
declare function resolveReference(key: string, references: Reference[], links: LinksConfig): ResolvedReference | undefined;

interface BeamMdxContextValue {
    /** The satellite's citation manifest (the concrete keys `<Ref>` can resolve). */
    references: Reference[];
    /** The satellite's content resolver, bound to its `virtual:beam-mdx/content` map. */
    resolve: (name: string) => ContentModule | undefined;
}
declare function BeamMdxProvider({ references, resolve, children, }: BeamMdxContextValue & {
    children: ReactNode;
}): react.JSX.Element;
/** The manifest + resolver from the nearest provider (empty/no-op defaults if unwrapped). */
declare function useBeamMdx(): BeamMdxContextValue;
/** The env-driven base-URL map from Inertia's shared page props. */
declare function useLinks(): LinksConfig;

/**
 * The **runtime** MDX render path — the counterpart to the build-time Vite compile, for MDX
 * that arrives *after* the bundle (e.g. content streamed from an authenticated route). The
 * package has no runtime compiler otherwise: everything else is precompiled from the content
 * glob into static components. This adds the missing capability.
 *
 * It is deliberately **generic**: it takes an MDX string and a component map and knows nothing
 * about where the text came from, any access gate, or a "guide". The frontmatter pair mirrors
 * the build preset so a leading `---` block is stripped identically; pass the same extra
 * remark/rehype plugins the preset runs (e.g. `remark-gfm`, `rehype-slug`) for byte-identical
 * fidelity.
 */
/**
 * A map of tag/component name → React component, injected as MDX's `components` prop. Values
 * are permissive (`ComponentType<any>`): MDX components carry heterogeneous, per-component
 * prop shapes, exactly as the build-time `mdxComponents` map does.
 */
type MdxComponentMap = Record<string, ComponentType<any>>;
interface RuntimeMdxOptions {
    /** Extra remark plugins to run after the frontmatter pair (match the build preset). */
    remarkPlugins?: PluggableList;
    /** Rehype plugins to run on the HAST (e.g. `rehype-slug`, syntax highlighting). */
    rehypePlugins?: PluggableList;
}
type MdxContentComponent = ComponentType<{
    components?: MdxComponentMap;
}>;
/**
 * Compile raw MDX text into a React component at runtime, in the browser. Async — MDX
 * compilation and evaluation both return promises. Throws on malformed MDX so a caller can
 * present an error state.
 */
declare function compileMdx(source: string, options?: RuntimeMdxOptions): Promise<MdxContentComponent>;
interface RuntimeMdxProps extends RuntimeMdxOptions {
    /** The raw MDX text to compile and render. */
    source: string;
    /** The component map injected as MDX `components` (the kit: Callout, Steps, Figure, …). */
    components?: MdxComponentMap;
    /** Shown while compilation is in flight. */
    fallback?: ReactNode;
    /** Rendered when compilation throws (malformed MDX); receives the error. */
    renderError?: (error: Error) => ReactNode;
}
/**
 * Render raw MDX text through a supplied component map, compiling on the fly. A thin React
 * wrapper over {@see compileMdx} that manages the async compile + error state. Recompiles when
 * the source or plugin set changes.
 */
declare function RuntimeMdx({ source, components, fallback, renderError, remarkPlugins, rehypePlugins, }: RuntimeMdxProps): ReactElement | null;
/**
 * Fetch raw MDX text from a URL and return it. The default {@link RemoteMdx} transport: a
 * same-origin GET asking for `text/markdown`, throwing on a non-2xx so the caller's error path
 * runs. Exported so a consumer can compose it (e.g. wrap it to add a header).
 */
declare function fetchMdx(source: string): Promise<string>;
interface RemoteMdxProps extends RuntimeMdxOptions {
    /** The URL to fetch the raw MDX text from. */
    source: string;
    /** The component map injected as MDX `components` (the kit). */
    components?: MdxComponentMap;
    /**
     * Override the transport — supply auth headers, a different fetch client, a signed URL, an
     * in-memory stub in tests, etc. Receives the `source` URL, resolves the raw MDX text, and
     * should throw on failure. Defaults to {@link fetchMdx} (same-origin `text/markdown` GET).
     * Pass a **stable** reference (module-level or memoized) — it is a re-fetch dependency.
     */
    fetcher?: (source: string) => Promise<string>;
    /** Shown while the fetch or the compile is in flight. */
    fallback?: ReactNode;
    /** Rendered on a fetch or compile failure; receives the error. */
    renderError?: (error: Error) => ReactNode;
}
/**
 * The **content-delivery client**: fetch raw MDX from a URL, then render it through the kit via
 * {@link RuntimeMdx}. Generic — it knows nothing about auth, gates, or "guides"; the URL points
 * wherever the host decides (e.g. an authenticated gate-and-stream route), and the transport is
 * overridable via `fetcher`. The host wraps this with its own chrome + loading/error affordances.
 */
declare function RemoteMdx({ source, components, fetcher, fallback, renderError, remarkPlugins, rehypePlugins, }: RemoteMdxProps): ReactElement | null;

/**
 * The **authoring** twin of {@link RuntimeMdx}: an editable MDX buffer beside a live preview that
 * recompiles as you type. A developer drops `<MdxEditor value={…} onChange={…} components={kit} />`
 * and gets a text area whose edits re-render through the same runtime compile path the reader uses,
 * so what an author sees while editing is what a visitor gets.
 *
 * Deliberately **generic and unstyled** (class hooks only): it knows nothing about routes, gates,
 * tenants, or "docs" — it edits a string. The buffer is *controlled* (the host owns the value, so
 * the same buffer can also drive the page's live `main` re-render); the preview is the shipped
 * {@link RuntimeMdx} over that value, given the same kit + plugins the reader uses for fidelity.
 * Client-only, like `RuntimeMdx` (kept out of the `/vite` node entry).
 */
interface MdxEditorProps extends RuntimeMdxOptions {
    /** The current raw MDX buffer (controlled by the host). */
    value: string;
    /** Called with the next buffer on every edit. */
    onChange: (next: string) => void;
    /** The kit component map injected into the live preview (Callout, Steps, Figure, …). */
    components?: MdxComponentMap;
    /** Hide the live preview pane (edit-only). Defaults to showing it. */
    preview?: boolean;
    /** Shown in the preview while a compile is in flight. */
    fallback?: ReactNode;
    /** Rendered in the preview when the buffer is malformed MDX; receives the error. */
    renderError?: (error: Error) => ReactNode;
    /** Class hooks — the host skins the layout, the textarea, and the preview. */
    className?: string;
    editorClassName?: string;
    previewClassName?: string;
    /** Textarea passthroughs. */
    placeholder?: string;
    spellCheck?: boolean;
    'aria-label'?: string;
}
/**
 * A controlled MDX editor + live preview. The textarea drives `onChange`; the preview is a
 * {@link RuntimeMdx} over the current `value`, so it recompiles on every edit through the kit map.
 */
declare function MdxEditor({ value, onChange, components, preview, fallback, renderError, remarkPlugins, rehypePlugins, className, editorClassName, previewClassName, placeholder, spellCheck, 'aria-label': ariaLabel, }: MdxEditorProps): ReactElement;

/**
 * The flat-scalar frontmatter map — one `key: value` per line, values kept as their raw string
 * remainder. This is the same frontmatter subset the build-time content plane reads (the draft
 * gate's `readFrontmatter`) and the server twin (`Mdx::fields`), so the three stay in agreement.
 * Nested/structured YAML is out of scope for this primitive (the content plane doesn't use it).
 */
type MdxFrontmatter = Record<string, string>;
interface ParsedMdx {
    /** The parsed flat-scalar frontmatter (empty when the document has no leading `---` block). */
    frontmatter: MdxFrontmatter;
    /** Everything after the closing `---` delimiter, byte-for-byte (empty string if none). */
    body: string;
    /** Whether a leading `---` frontmatter block was present. */
    hasFrontmatter: boolean;
}
/**
 * Split a raw MDX document into its flat-scalar frontmatter and its body. Lossless for the
 * canonical form this primitive owns — one `key: value` per line, `---` delimiters — so
 * {@link serializeMdx}`(parseFrontmatter(x))` reproduces `x`. A document with no leading `---`
 * returns an empty map and the whole string as `body`.
 */
declare function parseFrontmatter(raw: string): ParsedMdx;
/**
 * Reserialize a flat-scalar frontmatter map + a body back into a raw MDX document. The inverse
 * of {@link parseFrontmatter}. An empty map with `hasFrontmatter: false` (or no keys) emits the
 * body alone — no empty `---` block. Field order follows the map's insertion order, so mutating
 * a parsed map's values (or adding keys) reserializes predictably.
 */
declare function serializeMdx(parsed: ParsedMdx): string;
/**
 * Convenience overload: build a raw document from a frontmatter map + body directly (the shape a
 * form + editor produce). Emits a `---` block whenever the map is non-empty.
 */
declare function serializeFrontmatter(frontmatter: MdxFrontmatter, body: string): string;
/** A transport that resolves a URL to raw MDX text (throws on failure). Defaults to {@link fetchMdx}. */
type MdxLoader = (url: string) => Promise<string>;
/** A transport that persists a raw MDX body to a URL (throws on failure). */
type MdxSaver = (url: string, body: string) => Promise<void>;
/**
 * Persist raw MDX to a URL with a same-origin `PUT` of `text/markdown`. The write twin of
 * {@link fetchMdx}: content rides as a raw document body (not a JSON field), so the bytes are
 * exact end to end. Carries **no** CSRF — the app layer overrides the saver to add its token.
 * Exported so a consumer can compose it.
 */
declare const putMdx: MdxSaver;
/**
 * Load the raw MDX source at a URL, seeding an editor. Thin over the transport so the URL is
 * caller-supplied and the transport is overridable (auth headers, a stub in tests); it hardcodes
 * no path. Defaults to {@link fetchMdx} (same-origin `text/markdown` GET).
 */
declare function loadRawMdx(url: string, loader?: MdxLoader): Promise<string>;
/**
 * Save an edited MDX body to a URL. Mirrors {@link loadRawMdx}: caller-supplied URL, overridable
 * transport (defaults to {@link putMdx}), no hardcoded path. The app passes a `saver` that adds
 * CSRF + the resolved-by-name endpoint.
 */
declare function saveMdx(url: string, body: string, saver?: MdxSaver): Promise<void>;

/**
 * Inline evidence cite: `<Ref to="key">the claim words</Ref>`. A `live` entry renders a
 * dofollow anchor at the point of a concrete claim; a `pending` entry (or an unknown key)
 * degrades to the plain child text so no dead link ever ships.
 */
declare function Ref({ to, children }: {
    to: string;
    children: ReactNode;
}): react.JSX.Element;
/**
 * End-of-essay receipts: `<Receipts keys={frontmatter.references} />`. Lists each live
 * referenced sibling as a labeled row (kind · title · summary · dofollow link). Pending and
 * unknown keys are dropped; renders nothing when no live entry remains.
 */
declare function Receipts({ keys }: {
    keys?: string[];
}): react.JSX.Element | null;

/**
 * Render an authored .mdx fragment by name, inline and bare — the fragment's own
 * frontmatter layout is ignored, so a shared block of prose can be dropped into any page,
 * layout, or MDX file. Resolves against the content map supplied through <BeamMdxProvider>.
 */
declare function Content({ name }: {
    name: string;
}): react.JSX.Element | null;

/** One Schema.org node — a flat JSON-LD object. `jsonLd` on a page may be one or many. */
type JsonLdNode = Record<string, unknown>;
declare function JsonLd({ data }: {
    data: JsonLdNode | JsonLdNode[];
}): react.JSX.Element;
/**
 * The MDX content plane's own JSON-LD: built React-side from a file's frontmatter, never
 * through a PHP schema package. Deliberately minimal — @type/name from the declared
 * schemaType + title, optional description/datePublished, identity from the page's
 * canonical URL, and cross-property `citation` nodes for the *live* references (the
 * structured-data twin of the Receipts block — no premature link equity for pending
 * targets). A guide reads as TechArticle, a story/insight as Article. Anything richer
 * (per-tenant, engine-generated) belongs in the DTO/publishing plane, not here.
 */
declare function contentJsonLd(frontmatter: ContentFrontmatter, url: string, references: Reference[], links: LinksConfig): JsonLdNode;

/** The layout components a satellite maps each `layout` frontmatter value onto. */
type ContentLayouts = Record<ContentLayout, ComponentType<{
    children: ReactNode;
}>>;
interface ContentShowProps {
    /** Content name to render (e.g. 'essays/foo' or 'about'). */
    slug: string;
    /** The satellite's content resolver, bound to its `virtual:beam-mdx/content` map. */
    resolve: (name: string) => ContentModule | undefined;
    /** Brand layouts, keyed by the frontmatter `layout` value. */
    layouts: ContentLayouts;
    /** The MDX component map (embed <Content>, <Ref>, plus brand essay devices). */
    mdxComponents: Record<string, unknown>;
    /** The satellite's citation manifest — powers <Ref>, <Receipts>, and JSON-LD citations. */
    references?: Reference[];
    /** Content-name prefixes gated by a published date (draft convention). */
    draftablePrefixes?: string[];
    /**
     * Override the default eyebrow above the title (which prints `navGroup`). When
     * provided and it returns non-null, that node renders in the eyebrow's place — e.g.
     * a breadcrumb trail. The dated-essay meta line (draft/date/topic) is untouched.
     */
    renderEyebrow?: (frontmatter: ContentFrontmatter) => ReactNode;
}
/**
 * The file-driven content renderer: resolve the MDX module for `slug`, wrap it in the
 * satellite's chosen layout, emit frontmatter-driven JSON-LD (with live cross-property
 * citations), render the compiled MDX with the injected component map, and close with the
 * Receipts ledger. Everything satellite-specific — layouts, essay devices, the citation
 * manifest — arrives as props; the brand look rides the host seam through .site-prose
 * (the shadcn semantic tokens — never one satellite's brand prefix).
 */
declare function ContentShow({ slug, resolve, layouts, mdxComponents, references, draftablePrefixes, renderEyebrow, }: ContentShowProps): react.JSX.Element;

export { type BeamMdxContextValue, BeamMdxProvider, type BroadcastListItem, type BroadcastPlatform, Content, type ContentApi, type ContentFrontmatter, type ContentLayout, type ContentLayouts, type ContentModule, type ContentNavNode, type ContentNavOptions, ContentShow, type ContentShowProps, DEFAULT_DRAFTABLE_PREFIXES, type EssayListItem, type EssayTopic, JsonLd, type JsonLdNode, type LinksConfig, type MdxComponentMap, MdxEditor, type MdxEditorProps, type MdxFrontmatter, type MdxLoader, type MdxSaver, type ParsedMdx, type RawContentModule, type RawContentModules, Receipts, Ref, type Reference, type ReferenceKind, RemoteMdx, type RemoteMdxProps, type ResolvedReference, RuntimeMdx, type RuntimeMdxOptions, type RuntimeMdxProps, compileMdx, contentJsonLd, contentNavNodes, createContent, fetchMdx, isDraft, loadRawMdx, parseFrontmatter, putMdx, resolveReference, saveMdx, serializeFrontmatter, serializeMdx, useBeamMdx, useLinks };
