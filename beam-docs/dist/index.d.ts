import * as react from 'react';
import { CSSProperties } from 'react';
import { P as PublicationData, a as PublishInputData, D as DocsChromeData, b as DocsRelatedData } from './types-BXgjOBm9.js';
export { c as PublicationStatus } from './types-BXgjOBm9.js';
import { ChromeProps, ChromeSlots, ChromeComponent } from '@splicewire/beam-ux/docs';

/** Return decoded JSON, retaining the server's `{ data: ... }` envelope. */
type DocsTransport = (url: string, init?: RequestInit) => Promise<unknown>;
/** Cookie-authenticated, same-origin Laravel transport; never renders an HTTP error body. */
declare const fetchDocs: DocsTransport;
declare function createDocsPublicationsClient(endpoint?: string, transport?: DocsTransport): {
    list(signal?: AbortSignal): Promise<PublicationData[]>;
    get(id: string, signal?: AbortSignal): Promise<PublicationData>;
    publish(version: PublishInputData["version"], signal?: AbortSignal): Promise<PublicationData>;
    retry(id: string, signal?: AbortSignal): Promise<PublicationData>;
};
/** Only a server-selected, successful Scalar Registry destination can become a clickable link. */
declare function scalarRegistryUrl(value: string | null | undefined): string | null;

/** The Scalar entry point this component drives. Structural — we never import the package. */
type ApiReferenceFactory = (selectorOrElement: string | HTMLElement, configuration: Record<string, unknown>) => unknown;
/** The default CDN source. Exported so a host can pin or re-host from it. */
declare const SCALAR_CDN_URL = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.65.1/dist/browser/standalone.js";
/** A lazy loader resolving a factory (the flagship code-splits its patched local Scalar). */
type ApiReferenceLoader = () => Promise<ApiReferenceFactory>;
type ApiReferenceProps = {
    /** The OpenAPI document URL — typically the host's own `beam/openapi.json` (ADR-0211). */
    specUrl: string;
    /**
     * Injected renderer factory. Supply it (from a host-installed `@scalar/api-reference`) and the
     * component never touches the network for its renderer — the air-gapped / CSP-strict path.
     */
    createApiReference?: ApiReferenceFactory;
    /** Where to load the renderer from when no factory is injected. Defaults to {@link SCALAR_CDN_URL}. */
    scriptUrl?: string;
    /** Renderer theme name. Defaults to `default` — a renderer preset, not a beam palette. */
    theme?: string;
    /** Host theme CSS (fonts, accent colors). The package contributes no palette of its own. */
    customCss?: string;
    /** Keep the MCP-layer curation. Default `true`; set `false` to let the renderer show it. */
    hideMcpLayer?: boolean;
    /** Escape hatch: extra renderer configuration, shallow-merged last. */
    configuration?: Record<string, unknown>;
    /** Called when the renderer cannot be loaded, so a host can log or swap in a fallback. */
    onError?: (error: unknown) => void;
    /** A successful, server-selected Registry link. Explicit null suppresses link discovery. */
    registryUrl?: string | null;
    /** Optional server-policy endpoint. configureDocs() supplies the package endpoint. */
    registryLinkEndpoint?: string | null;
    /** Decoded-JSON transport used only for the Registry link, never for the Scalar renderer. */
    transport?: DocsTransport;
    className?: string;
    style?: CSSProperties;
};
declare function ApiReference({ specUrl, createApiReference, scriptUrl, theme, customCss, hideMcpLayer, configuration, onError, registryUrl, registryLinkEndpoint, transport, className, style, }: ApiReferenceProps): react.JSX.Element;

declare function DocsLayout({ nav, linkComponent, currentHref, slots, classNames, page, children }: ChromeProps): react.JSX.Element;

type LinkComponent = NonNullable<ChromeProps['linkComponent']>;
/**
 * The packaged docs header (docs-walkthrough DM4, DOC-7), drawn from the server's `DocsChromeData` so no host spells one:
 * the product's mark and name (linking the docs home), the root's surfaces, Back to the product's site page, and the
 * product switcher. Search and the appearance toggle are slots that DOCS-14 and DOCS-13 fill; `headerActions` is the one
 * hole a host keeps, for author-only controls. Under 60rem a menu button opens the rail as a drawer.
 */
declare function DocsHeader({ chrome, currentHref, slots, linkComponent, drawerOpen, onToggleDrawer, }: {
    chrome: DocsChromeData;
    currentHref?: string;
    slots?: ChromeSlots;
    linkComponent?: LinkComponent;
    drawerOpen: boolean;
    onToggleDrawer: () => void;
}): react.JSX.Element;

/**
 * The docs product switcher (docs-walkthrough DOC-16, C-6): one packaged control, fed by `DocsChromeData.related`, that
 * replaces each host's hand "Beam" pill.
 *
 * One disclosure contract. A click toggles; a hover only PREVIEWS, and the preview never flips the state a click will
 * flip, so the click that follows a hover leaves it open (the hand pill closed there, shots 40/41). Escape and a pointer
 * landing outside dismiss it. Each product shows its brand tagline, its site and its docs.
 */
declare function ProductSwitcher({ related, className }: {
    related: DocsRelatedData[];
    className?: string;
}): react.JSX.Element | null;

declare const DOCS_LAYOUT_CSS = "\n.beam-docs { display: flex; min-height: 100vh; flex-direction: column; }\n.beam-docs-body {\n  margin-inline: auto;\n  display: flex;\n  width: 100%;\n  max-width: var(--beam-docs-width, 80rem);\n  flex: 1 1 auto;\n  gap: var(--beam-docs-gap, 2.5rem);\n  padding-inline: var(--beam-gutter, 1.5rem);\n  padding-block: var(--beam-docs-pad, 2.5rem);\n}\n.beam-docs-rail { width: var(--beam-docs-rail, 14rem); flex: none; }\n.beam-docs-main { min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }\n\n/* The page never scrolls sideways (integrator 08:33Z, DOCS-13): a long URL or identifier in inline code breaks, and a\n   code block or table that cannot fit scrolls inside itself, at desktop and at 390px. */\n.beam-docs-main :not(pre) > code { overflow-wrap: anywhere; }\n.beam-docs-main pre { max-width: 100%; overflow-x: auto; }\n.beam-docs-main table { display: block; max-width: 100%; overflow-x: auto; }\n.beam-docs-aside { width: var(--beam-docs-aside, 14rem); flex: none; }\n\n/* The two side columns are the first thing to go on a narrow viewport: a rail and an on-this-page\n   column beside a reading measure is three columns in the width of one. The rail's content is still\n   reachable \u2014 it is the same projection the site nav renders from (ADR-0210 \u00A75, one payload). */\n@media (max-width: 80rem) { .beam-docs-aside { display: none; } }\n@media (max-width: 60rem) { .beam-docs-rail { display: none; } }\n\n/* A SpreadTemplate entry is a whole application rather than an article (the API reference, the MCP\n   catalogue) and brings its own sidebar and search, so the layout gives it the viewport instead of a\n   main column between the rail and the on-this-page column. `data-beam-full-bleed` only escapes the\n   reading measure; without this, Scalar rendered into ~41rem on every host but the flagship, which\n   carried the rule itself (beam-docs-satellite ticket 54 \u00A73). */\n.beam-docs:has(.beam-tpl-spread) .beam-docs-body {\n  max-width: none;\n  padding-inline: 0;\n  padding-block: 0;\n  gap: 0;\n}\n.beam-docs:has(.beam-tpl-spread) .beam-docs-rail,\n.beam-docs:has(.beam-tpl-spread) .beam-docs-aside { display: none; }\n\n/* The packaged header (DOCS-12, DM4). Structure only; colours come from the defined --beam-* tokens or the host hooks,\n   so DOCS-13's theme values reach it without a second rule. It wraps rather than scrolls at 390px (DOC-8). */\n.beam-docs-header {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: var(--beam-docs-header-gap, 0.75rem 1.5rem);\n  padding: var(--beam-docs-header-pad, 0.75rem var(--beam-gutter, 1.5rem));\n  border-bottom: 1px solid var(--beam-border, var(--beam-line));\n}\n.beam-docs-brand { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; text-decoration: none; color: inherit; }\n.beam-docs-brand img { height: 1.375rem; width: auto; }\n.beam-docs-surfaces { display: flex; flex-wrap: wrap; gap: 1rem; }\n.beam-docs-surfaces a { text-decoration: none; color: inherit; opacity: 0.75; }\n.beam-docs-surfaces a[aria-current='page'] { opacity: 1; font-weight: 600; }\n.beam-docs-header-end { margin-left: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }\n.beam-docs-back { text-decoration: none; color: inherit; opacity: 0.75; white-space: nowrap; }\n.beam-docs-drawer-toggle { display: none; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; }\n\n/* The product switcher (DOC-16): a panel under its trigger, above the page. */\n.beam-docs-switcher { position: relative; }\n.beam-docs-switcher > button { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.75rem; cursor: pointer; }\n.beam-docs-switcher-panel {\n  position: absolute;\n  right: 0;\n  top: calc(100% + 0.5rem);\n  z-index: 30;\n  width: min(18rem, calc(100vw - 2rem));\n  padding: 0.75rem;\n  border: 1px solid var(--beam-border, var(--beam-line));\n  border-radius: var(--beam-radius, 0.5rem);\n  background: var(--beam-paper-raised, Canvas);\n}\n.beam-docs-switcher-item { display: flex; flex-direction: column; gap: 0.25rem; }\n.beam-docs-switcher-item p { margin: 0; opacity: 0.75; }\n\n/* Under 60rem the rail is a drawer the header's menu button opens (DOC-8), not a vanished column. */\n@media (max-width: 60rem) {\n  .beam-docs-drawer-toggle { display: inline-flex; }\n  .beam-docs[data-drawer-open] .beam-docs-rail {\n    display: block;\n    position: fixed;\n    inset: 0 auto 0 0;\n    z-index: 40;\n    width: min(20rem, 85vw);\n    overflow-y: auto;\n    padding: 1rem;\n    background: var(--beam-paper, Canvas);\n    border-right: 1px solid var(--beam-border, var(--beam-line));\n  }\n}\n\n/* The packaged search box (DOCS-14): a field in the header and a results panel under it. Colours are tokens. */\n.beam-docs-search { position: relative; }\n.beam-docs-search input {\n  width: min(16rem, 60vw);\n  padding: 0.25rem 0.625rem;\n  border: 1px solid var(--beam-border, var(--beam-line));\n  border-radius: var(--beam-radius, 0.5rem);\n  background: transparent;\n  color: inherit;\n  font: inherit;\n}\n.beam-docs-search-results {\n  position: absolute;\n  right: 0;\n  top: calc(100% + 0.5rem);\n  z-index: 30;\n  width: min(26rem, calc(100vw - 2rem));\n  max-height: 70vh;\n  overflow-y: auto;\n  padding: 0.5rem;\n  border: 1px solid var(--beam-border, var(--beam-line));\n  border-radius: var(--beam-radius, 0.5rem);\n  background: var(--beam-paper-raised, Canvas);\n}\n.beam-docs-search-results a { display: block; padding: 0.5rem; text-decoration: none; color: inherit; border-radius: var(--beam-radius, 0.5rem); }\n.beam-docs-search-results a small { display: block; opacity: 0.65; }\n.beam-docs-search-results a p { margin: 0.25rem 0 0; opacity: 0.75; }\n\n/* DOCS-13 (DM5): the docs read ONE token family. The rail, header and body take their ink from --beam-* (which flips\n   under .dark), never a host's dark-rail --sidebar-* ink, which drew the invisible rail of shots 23/35. */\n.beam-docs { color: var(--beam-fg, var(--beam-ink)); background: var(--beam-paper); }\n/* --beam-ink-70, not --beam-ink-muted: 5.87:1 on --beam-paper in light and 7.69:1 in dark (ink-muted is 3.19 in light),\n   so rail links clear DOC-8's 4.5:1 in both schemes; no host hook sits in front of it. */\n.beam-docs-rail a { color: var(--beam-ink-70); }\n.beam-docs-rail a:hover { color: var(--beam-fg, var(--beam-ink)); }\n.beam-docs-rail a[aria-current='page'], .beam-docs-rail a[data-active='true'] { color: var(--beam-fg, var(--beam-ink)); font-weight: 600; }\n.beam-docs-appearance { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.5rem; cursor: pointer; }\n\n/* A reference on a spread page fills the viewport under the header (it was each host's wrapper's job, DOCS-13). */\n.beam-tpl-spread [data-beam-ux-api-reference] { height: calc(100vh - var(--beam-docs-header-height, 3.25rem)); }\n";

type DocsConfig = {
    /** Set null to disable Registry-link requests. Server policy still decides whether to return a link. */
    registryLinkEndpoint?: string | null;
    transport?: DocsTransport;
    layout?: ChromeComponent;
    /** `docs.search` (DOCS-14, DM6). Null turns the packaged header's search box off; a host `search` slot replaces it. */
    searchEndpoint?: string | null;
    /** The host's ONE Scalar lever (DM5): a factory, or a lazy loader (e.g. the flagship's code-split patched build). */
    createApiReference?: ApiReferenceFactory;
    loadApiReference?: ApiReferenceLoader;
};
/** Call after host entry-page configuration. Explicit invocation survives tree shaking. */
declare function configureDocs(options?: DocsConfig): void;

type DocsPublishingPanelProps = {
    endpoint?: string;
    transport?: DocsTransport;
    pollIntervalMs?: number;
    className?: string;
};
/** Mount only for an authorized operator; the server independently authorizes every request. */
declare function DocsPublishingPanel({ endpoint, transport, pollIntervalMs, className, }: DocsPublishingPanelProps): react.JSX.Element;

export { ApiReference, type ApiReferenceFactory, type ApiReferenceProps, DOCS_LAYOUT_CSS, type DocsConfig, DocsHeader, DocsLayout, DocsPublishingPanel, type DocsPublishingPanelProps, type DocsTransport, ProductSwitcher, PublicationData, SCALAR_CDN_URL, configureDocs, createDocsPublicationsClient, fetchDocs, scalarRegistryUrl };
