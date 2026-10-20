import * as react from 'react';
import { ReactNode, CSSProperties, ComponentType, createElement } from 'react';
import { L as LinkComponent, S as SiteNavData, M as ManifestEntry, a as ManifestAvailability, b as ManifestFetcher } from './types-Bzws8ncP.js';
export { c as ManifestFetchResult, d as ManifestPayload, e as SiteNavItem } from './types-Bzws8ncP.js';
import { S as StyleRegistry, c as compileEntryStyles } from './style-runtime-CugOvocy.js';
import { jsx, jsxs } from 'react/jsx-runtime';
import './style-DwvipGPs.js';

type SiteFooterLink = {
    title: string;
    href: string;
    /** External (`<a href>`, e.g. `mailto:`) vs. routed through `linkComponent`. */
    external?: boolean;
};
type SiteLayoutProps = {
    /** Page content — the single required slot. */
    children: ReactNode;
    /** Brand mark shown at the header start (host wordmark/logo). */
    brand?: ReactNode;
    /** Header nav slot — typically a `<SiteNav>`. Rendered after the brand. */
    nav?: ReactNode;
    /** Brand mark shown in the footer. Defaults to `brand` when omitted. */
    footerBrand?: ReactNode;
    /** Footer links (privacy / terms / contact …). Routed via `linkComponent` unless `external`. */
    footerLinks?: SiteFooterLink[];
    /**
     * Router link component for footer links (e.g. Inertia `Link`). Defaults to a plain `<a>`.
     * `external` links always use `<a>`.
     */
    linkComponent?: LinkComponent;
    /**
     * Escape hatch: replace the whole default header. When set, `brand` + `nav` are ignored and
     * this renders in the header's place.
     */
    header?: ReactNode;
    /**
     * Escape hatch: replace the whole default footer. When set, `footerBrand` + `footerLinks` are
     * ignored and this renders in the footer's place.
     */
    footer?: ReactNode;
    /** Extra head content (font `<link>`s, `<style>` theme injection) — the host owns its theme. */
    head?: ReactNode;
    className?: string;
    style?: CSSProperties;
    headerClassName?: string;
    headerStyle?: CSSProperties;
    mainClassName?: string;
    mainStyle?: CSSProperties;
    footerClassName?: string;
    footerStyle?: CSSProperties;
    footerLinkClassName?: string;
    footerLinkStyle?: CSSProperties;
};
declare function SiteLayout({ children, brand, nav, footerBrand, footerLinks, linkComponent, header, footer, head, className, style, headerClassName, headerStyle, mainClassName, mainStyle, footerClassName, footerStyle, footerLinkClassName, footerLinkStyle, }: SiteLayoutProps): react.JSX.Element;

/**
 * The default rules, exported so a host can extend rather than replace — `css={PROSE_CSS + extra}`.
 *
 * Scoped to an attribute selector rather than a class name so the rules cannot collide with a host's
 * own `.prose` (Tailwind Typography's, most likely) and so the two can coexist on one page.
 */
declare const PROSE_CSS = "\n[data-beam-prose] {\n  color: var(--beam-fg, inherit);\n  font-family: var(--beam-font-sans, inherit);\n  font-size: var(--beam-prose-size, 1rem);\n  line-height: var(--beam-prose-leading, 1.7);\n}\n\n/* Rhythm: space comes from the element ABOVE, so the first child never pushes the block down. */\n[data-beam-prose] > * { margin-block: 0; }\n[data-beam-prose] > * + * { margin-block-start: var(--beam-prose-gap, 1.25em); }\n\n[data-beam-prose] h1,\n[data-beam-prose] h2,\n[data-beam-prose] h3,\n[data-beam-prose] h4 {\n  color: var(--beam-heading, var(--beam-fg, inherit));\n  font-family: var(--beam-font-display, var(--beam-font-sans, inherit));\n  font-weight: var(--beam-heading-weight, 600);\n  line-height: 1.25;\n  text-wrap: balance;\n}\n\n[data-beam-prose] > h1 { font-size: 2.25em; }\n[data-beam-prose] > h2 { font-size: 1.5em; }\n[data-beam-prose] > h3 { font-size: 1.25em; }\n[data-beam-prose] > h4 { font-size: 1.05em; }\n\n/* A heading belongs to what follows it, so it gets more space above than below. */\n[data-beam-prose] > * + :is(h1, h2, h3, h4) { margin-block-start: var(--beam-prose-heading-gap, 2em); }\n[data-beam-prose] > :is(h1, h2, h3, h4) + * { margin-block-start: var(--beam-prose-gap, 0.75em); }\n\n[data-beam-prose] a {\n  color: var(--beam-accent, currentColor);\n  text-decoration: underline;\n  text-underline-offset: 0.2em;\n}\n\n[data-beam-prose] strong { color: var(--beam-heading, var(--beam-fg, inherit)); font-weight: 650; }\n\n[data-beam-prose] :is(ul, ol) { padding-inline-start: 1.5em; }\n[data-beam-prose] ul { list-style: disc; }\n[data-beam-prose] ol { list-style: decimal; }\n[data-beam-prose] li + li { margin-block-start: 0.4em; }\n[data-beam-prose] li::marker { color: var(--beam-fg-muted, currentColor); }\n\n[data-beam-prose] :not(pre) > code {\n  background: var(--beam-surface-2, color-mix(in srgb, currentColor 8%, transparent));\n  border-radius: 0.3em;\n  font-family: var(--beam-font-mono, ui-monospace, monospace);\n  font-size: 0.9em;\n  padding: 0.15em 0.4em;\n}\n\n[data-beam-prose] pre {\n  background: var(--beam-surface-2, color-mix(in srgb, currentColor 8%, transparent));\n  border: 1px solid var(--beam-border, transparent);\n  border-radius: var(--beam-radius, 0.5rem);\n  font-family: var(--beam-font-mono, ui-monospace, monospace);\n  font-size: 0.875em;\n  line-height: 1.6;\n  overflow-x: auto;\n  padding: 1em 1.15em;\n}\n[data-beam-prose] pre code { background: none; font-size: inherit; padding: 0; }\n\n[data-beam-prose] blockquote {\n  border-inline-start: 2px solid var(--beam-accent, currentColor);\n  color: var(--beam-fg-muted, inherit);\n  padding-inline-start: 1em;\n}\n\n[data-beam-prose] hr { border: 0; border-block-start: 1px solid var(--beam-border, currentColor); opacity: 0.6; }\n\n/* Tables scroll inside their own box rather than widening the page. */\n[data-beam-prose] table { border-collapse: collapse; display: block; overflow-x: auto; width: 100%; }\n[data-beam-prose] :is(th, td) {\n  border-block-end: 1px solid var(--beam-border, currentColor);\n  padding: 0.5em 0.75em;\n  text-align: start;\n}\n[data-beam-prose] th { color: var(--beam-heading, var(--beam-fg, inherit)); font-weight: 600; }\n\n[data-beam-prose] :is(img, video) { border-radius: var(--beam-radius, 0.5rem); height: auto; max-width: 100%; }\n\n/* A full-bleed child (an embedded reference surface) opts out of the measure entirely. */\n[data-beam-prose] > [data-beam-full-bleed] { margin-inline: 0; max-width: none; }\n";
type ProseProps = {
    /** The rendered body. */
    children: ReactNode;
    /** Replace the stylesheet outright. Defaults to {@link PROSE_CSS}; `''` opts out of styling. */
    css?: string;
    /** Extra classes, applied after the defaults so a host layer wins. */
    className?: string;
    style?: CSSProperties;
    /** Rendered element. `article` by default — an entry body is a document. */
    as?: 'article' | 'div' | 'section' | 'main';
};
/**
 * Wrap a rendered entry body in beam's typographic scale.
 *
 * The `<style>` is emitted inline rather than registered globally, which keeps the component usable in
 * SSR, in a test renderer, and more than once on a page without ordering surprises — browsers dedupe
 * identical rules, and the cost is a few hundred bytes against a body that is already an HTTP round
 * trip. `useId` keeps React from complaining about repeated keys when several bodies render at once.
 */
declare function Prose({ children, css, className, style, as: Tag }: ProseProps): react.JSX.Element;

type SiteNavProps = {
    /** The projected `site` sitemap. Its top-level `items` render as the nav row. */
    nav?: SiteNavData | null;
    /** Router link component (e.g. Inertia `Link`). Defaults to a plain `<a>`. */
    linkComponent?: LinkComponent;
    /** Class applied to every rendered link (host theme hooks its selector here). */
    itemClassName?: string;
    /** Inline style applied to every rendered link. */
    itemStyle?: CSSProperties;
    /**
     * Render the subtree UNDER the node at this href instead of the whole sitemap — e.g. `/docs` for
     * a docs sidebar fed by the same projection the header uses. The matched node itself is not
     * rendered (it is the section you are already in); its children are. Trailing slashes are
     * ignored. No match ⇒ nothing renders, which is the honest signal that the docs root moved.
     */
    rootPath?: string;
    /**
     * How many levels to render. `1` (the default) is the flat fragment of links this component has
     * always emitted; anything greater renders nested `<ul>`/`<li>` down to that depth.
     */
    maxDepth?: number;
    /** Class applied to every `<ul>` in a nested render (`maxDepth > 1`). */
    listClassName?: string;
    /** Class applied to every `<li>` in a nested render (`maxDepth > 1`). */
    itemWrapperClassName?: string;
};
declare function SiteNav({ nav, linkComponent, itemClassName, itemStyle, rootPath, maxDepth, listClassName, itemWrapperClassName, }: SiteNavProps): react.JSX.Element;

/**
 * The default transport: global `fetch`, JSON, with 404 mapped to `absent` rather than an error.
 * Exported so a host wrapping it (auth headers, a base URL) keeps the absence contract for free.
 */
declare const fetchManifest: ManifestFetcher;
/** Class hooks for every element the table emits — each optional, none defaulted to a palette. */
type ManifestTableClassNames = {
    root?: string;
    row?: string;
    name?: string;
    title?: string;
    description?: string;
    /** The per-caller availability mark, when an overlay is supplied. */
    mark?: string;
    /** The "not installed" / empty / error message wrapper. */
    message?: string;
};
type ManifestTableViewProps = {
    /** The advertised entries. */
    items: ManifestEntry[];
    /** Optional per-caller overlay keyed by entry `name` (ADR-0210 §4). Absent ⇒ no marks rendered. */
    availability?: Record<string, ManifestAvailability> | null;
    /** Rendered instead of the rows when the contributor's endpoint 404s. */
    notInstalled?: ReactNode;
    /** Rendered when the endpoint is present but advertises nothing. */
    empty?: ReactNode;
    /** Which absence this is — drives which message shows when `items` is empty. */
    absent?: boolean;
    classNames?: ManifestTableClassNames;
    style?: CSSProperties;
};
/**
 * The pure renderer — data in, markup out, no fetching. Use directly for SSR, for a host that already
 * has the payload, or in a page that must not depend on a `QueryClientProvider`.
 */
declare function ManifestTableView({ items, availability, notInstalled, empty, absent, classNames, style, }: ManifestTableViewProps): react.JSX.Element;
type ManifestTableProps = Omit<ManifestTableViewProps, 'items' | 'absent'> & {
    /** The contributor-mounted JSON endpoint (e.g. `/beam/mcp/manifest.json`). */
    endpoint: string;
    /** Injected transport. Defaults to {@link fetchManifest} over global `fetch`. */
    fetcher?: ManifestFetcher;
    /** Rendered while the first read is in flight. */
    loading?: ReactNode;
    /** Rendered when the read fails for any reason OTHER than a 404. */
    error?: ReactNode | ((err: unknown) => ReactNode);
};
declare function ManifestTable({ endpoint, fetcher, loading, error, ...view }: ManifestTableProps): react.JSX.Element;

/**
 * Loads and renders a rendered entry's **compiled body artifact** (ADR-0209 §7).
 *
 * ## Why this is in the package rather than in every host
 *
 * `Route::beamUxSite()` hands the host page an entry, a nav projection, and the URL of the entry's
 * compiled artifact — and the host page owns everything that makes a beam site look like itself: the
 * chrome, the palette, the measure, and the component map a body may reach for. None of that belongs
 * here. But *getting the artifact onto the screen* is not any of those things: it is one exact
 * sequence, identical on every host, and it was wrong twice in ways no test caught.
 *
 * Ticket 07 found the artifact could not be imported by the page shell at all — it was compiled with
 * `outputFormat: 'program'`, emitting a bare `react/jsx-runtime` specifier a browser refuses — because
 * the output had only ever been verified as *compiler output*, never as a *module something loaded*.
 * Ticket 08 found the artifact's URL did not contain the version that was supposed to move it, so a
 * year-long `immutable` cache header sat on an address that never changed. A host re-deriving those
 * forty lines re-derives the bugs; beam-docs-satellite ticket 11 lifted them here so a fresh
 * `laravel-beam-starter` gets the contract right by installing it rather than by copying it.
 *
 * This is not the beam-ux-served *shim* ticket 07 rejected. That one was a PHP package serving a
 * runtime module, which would have had to resolve the **host's** React out of the host's Vite manifest
 * or break hooks. This is a JS package bundled by the host's own Vite with `react` as a peer
 * dependency, so the runtime injected below IS the host's React by construction — the same property,
 * bought with no moving parts.
 *
 * ## Why the module is CALLED rather than read
 *
 * The artifact imports nothing and default-exports a function taking a jsx runtime. That shape is what
 * lets a plain `import()` work with no import map, no `new Function` (so no CSP `unsafe-eval`), exactly
 * one React, and the same path server-side under SSR.
 *
 * `@vite-ignore` is load-bearing: the URL is a runtime route, not a build-time path, and without it
 * Vite tries to resolve it at build and fails.
 */
/** The jsx runtime handed to every artifact. `createElement` serves the tsx path's classic factory. */
declare const RUNTIME: {
    jsx: typeof jsx;
    jsxs: typeof jsxs;
    Fragment: react.ExoticComponent<react.FragmentProps>;
    createElement: typeof createElement;
    compileEntryStyles: typeof compileEntryStyles;
};
type ArtifactModule = {
    default: (runtime: typeof RUNTIME) => {
        default: ComponentType<Record<string, unknown>>;
    };
};
type EntryArtifact = {
    responsiveCss?: string;
    styleRegistry?: StyleRegistry;
    url: string;
    /**
     * Part of the artifact's ADDRESS, not metadata: an edited body compiles to a different URL, so a
     * changed version must re-import rather than reuse the module already in memory.
     */
    version?: string | null;
};
/**
 * Why there are FOUR states and not a boolean.
 *
 * `unauthored` (the entry has no artifact URL at all, because it has no body yet) used to collapse into
 * `failed`, and `failed`'s default message is operator-facing: *"run `php artisan
 * splicewire:beam:ux:compile`"*. Measured on beam.test 2026-09-11 (G2-BEAM-AUTHOR-EMPTY-ENTRY): a GUEST
 * reading the never-authored `/about` was told to run an artisan command — advice they cannot take, on
 * a host where that command was already current ("already current 13"). The entry was not uncompiled;
 * it was empty. Two different conditions had one message, and the message was false for the common one.
 */
type EntryArtifactStatus = 'loading' | 'ready' | 'unauthored' | 'failed';
type UseEntryArtifactResult = {
    /** The compiled body, or null unless `status === 'ready'`. */
    Body: ComponentType<Record<string, unknown>> | null;
    /** See {@link EntryArtifactStatus}. */
    status: EntryArtifactStatus;
    /**
     * The artifact EXISTS and could not be loaded. Never a reason to fall back to compiling in the
     * browser. Narrowed by this defect: "there is no artifact to load" is `unauthored`, not this.
     */
    failed: boolean;
};
/**
 * The component an artifact module yields, or **null when it yields none**.
 *
 * An artifact that loads and exports nothing is a failed artifact, not a component. Measured on
 * beam.test 2026-09-11: a canvas-authored page compiled to a module with an empty `module.exports`;
 * handing React the resulting `undefined` killed the entire page at render (minified error #130) — a
 * white screen where the honest answer was the same empty state a missing artifact already gets. A
 * reader must never lose the page over a build product they cannot fix.
 *
 * Extracted so this is testable without a real dynamic import: jsdom cannot `import()` an arbitrary
 * URL, so a test that goes through {@link useEntryArtifact} passes whether or not this check exists.
 */
declare function componentFromArtifact(mod: ArtifactModule): ComponentType<Record<string, unknown>> | null;
declare function useEntryArtifact(url: string, version?: string | null): UseEntryArtifactResult;
type EntryBodyProps = {
    artifact: EntryArtifact;
    /**
     * What the body may reach for — the contribution contract from the docs side (ADR-0210 §5). A beam
     * package contributes a seed row naming `<ApiReference>` or `<ManifestTable>` and ships no
     * frontend; this map is what makes those names resolve, so it is the HOST's to supply.
     */
    components?: Record<string, ComponentType<never>>;
    /**
     * Shown when an artifact that EXISTS cannot be loaded. Defaults to the operator-facing line naming
     * the command that fixes it, because that is what a broken artifact usually means.
     *
     * It is deliberately no longer the answer for an entry that simply has no body — see
     * {@link EntryBodyProps.empty} and {@link EntryArtifactStatus}.
     */
    fallback?: ReactNode;
    /**
     * Shown when the entry has never been authored (no artifact URL). Defaults to a reader-facing line
     * that states the fact and nothing else: a guest cannot run an artisan command, and telling them to
     * is both useless and wrong.
     */
    empty?: ReactNode;
    /** Shown while the artifact is in flight. Defaults to nothing — the load is usually imperceptible. */
    loading?: ReactNode;
    /**
     * Extra props handed to the compiled body — ADR-0213 §6's escape hatch. A screen component owns its
     * data logic and fetches, because an artifact is a static module addressed by body hash with
     * nowhere in it for a per-request value. Where a round trip is silly (the current user), the
     * renderer's page props reach the body here under one well-known name rather than each host
     * inventing a channel.
     */
    bodyProps?: Record<string, unknown>;
};
declare function EntryBody({ artifact, components, fallback, empty, loading, bodyProps }: EntryBodyProps): react.JSX.Element;

export { type EntryArtifact, type EntryArtifactStatus, EntryBody, type EntryBodyProps, LinkComponent, ManifestAvailability, ManifestEntry, ManifestFetcher, ManifestTable, type ManifestTableClassNames, type ManifestTableProps, ManifestTableView, type ManifestTableViewProps, PROSE_CSS, Prose, type ProseProps, type SiteFooterLink, SiteLayout, type SiteLayoutProps, SiteNav, SiteNavData, type SiteNavProps, type UseEntryArtifactResult, componentFromArtifact, fetchManifest, useEntryArtifact };
