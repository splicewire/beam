/**
 * `@splicewire/beam-ux/site` — generic public-site chrome (beam-ux-uplift ticket 10).
 *
 * So a fresh beam host gets marketing + legal-page chrome OOTB. Two portable, theme-neutral,
 * framework-neutral surfaces:
 *   - {@link SiteLayout} — a slot-based header / main / footer shell (brand + nav + footer-links as
 *     props/slots, per-slot class+style theme hooks, whole-header/footer escape hatches).
 *   - {@link SiteNav} — a data-driven nav over the projected `site` sitemap (the PHP `NavProjector`
 *     `nav` prop, ADR-0165): flat by default, nested under `rootPath` / `maxDepth` so a docs sidebar
 *     and the header nav come out of one payload.
 *
 * …and the two docs surfaces a contributed page renders (beam-docs-satellite ticket 20, ADR-0210 §5).
 * A contributing PHP package ships a seed row and a JSON endpoint and NO frontend, because these are
 * generic:
 *   - {@link ManifestTable} — renders a declared `{name, title, description}` shape from a URL, with
 *     an optional per-caller availability overlay and a loud "not installed" state on 404.
 *   - {@link ApiReference} — the OpenAPI reference surface, named for its ROLE so the renderer behind
 *     it can be swapped in one file. Loads from a CDN by default; takes an injected factory for
 *     air-gapped / CSP-strict installs.
 *
 * The package ships NO palette, fonts, or wordmark and imports NO router — a host supplies its theme
 * via className/style/CSS-vars and injects its `<Link>` through `linkComponent`. The Analog-Studio
 * ember theme stays host-local (audiostud collapses its `site-layout.tsx` to a thin token wrapper).
 */

export { SiteLayout, type SiteLayoutProps, type SiteFooterLink } from './SiteLayout.js';
export { SiteNav, type SiteNavProps } from './SiteNav.js';
export {
    ManifestTable,
    ManifestTableView,
    fetchManifest,
    type ManifestTableProps,
    type ManifestTableViewProps,
    type ManifestTableClassNames,
} from './ManifestTable.js';
export {
    ApiReference,
    SCALAR_CDN_URL,
    type ApiReferenceProps,
    type ApiReferenceFactory,
} from './ApiReference.js';
export type {
    SiteNavItem,
    SiteNavData,
    LinkComponent,
    ManifestEntry,
    ManifestPayload,
    ManifestFetchResult,
    ManifestFetcher,
    ManifestAvailability,
} from './types.js';
