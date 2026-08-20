/**
 * `@splicewire/beam-ux/site` — the shared shapes for the public-site chrome.
 *
 * Structural, framework-neutral, and theme-neutral by design. The `nav` a host feeds `<SiteNav>` is
 * the `site` sitemap projected by the PHP `NavProjector` (ADR-0165); its generated global shape
 * (`Rushing.DataNav.NavTree`) structurally satisfies {@link SiteNavData} without the package having to
 * depend on the host's generated types. Links are rendered through an injected {@link LinkComponent}
 * so a host can hand in its router's `<Link>` (Inertia / Router-DOM) — the package never imports one.
 */

import type { ComponentType, ReactNode } from 'react';

/** One projected nav node. A superset shape (extra keys allowed) so the host's `NavNode` fits it. */
export type SiteNavItem = {
    title: string;
    href?: string | null;
    /**
     * Nested nav nodes, if the projection carries a tree. Rendered by `<SiteNav>` only when
     * `maxDepth > 1` — the default stays the flat header row (ADR-0210 §5).
     */
    children?: SiteNavItem[];
};

/** The projected sitemap. Matches `Rushing.DataNav.NavTree` — `{ items }`. */
export type SiteNavData = {
    items: SiteNavItem[];
};

/**
 * A link renderer. Defaults to a plain `<a>`; a host injects its router's component (e.g. Inertia's
 * `Link`) to get client-side navigation. Kept to the intersection of the props both speak.
 */
export type LinkComponent = ComponentType<{
    href: string;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
}>;

/* ───────────────────── the contributed-manifest wire shape ───────────────────── */

/**
 * One advertised entry on a contributor-mounted manifest endpoint (ADR-0210 §3/§4). The declared
 * shape is `{ name, title, description }` — `name` is the stable machine id (an MCP tool name, a
 * capability key) and doubles as the row key; extra keys are tolerated and ignored, so a contributor
 * may serve a richer payload without this component learning about it.
 */
export type ManifestEntry = {
    name: string;
    title?: string | null;
    description?: string | null;
};

/**
 * What a contributor's endpoint serves: `{ items }`, the shape `<ManifestTable>` declares and a
 * contributing PHP package emits (ticket 06 builds beam-mcp's). A bare `ManifestEntry[]` is accepted
 * too, so a hand-rolled endpoint is not a wiring failure.
 */
export type ManifestPayload = { items: ManifestEntry[] } | ManifestEntry[];

/**
 * The result of one manifest read. `absent` is the **404 case specifically** — ADR-0210 §6's first
 * absence direction, a page whose contributor was uninstalled: the page still 200s, the table renders
 * its "not installed" empty state, and `beam:ux:doctor` reports the orphan server-side. Every other
 * failure (500, network, malformed body) throws and surfaces as the error state — an uninstalled
 * contributor and a broken one must not look alike.
 */
export type ManifestFetchResult = { status: 'ok'; items: ManifestEntry[] } | { status: 'absent' };

/**
 * The injected transport for a manifest read — beam-ux's standing rule that a component owns its
 * data logic (caching, keys, states) while the host owns the wire (ADR-0116). Defaults to
 * {@link fetchManifest} over the global `fetch`; a host with an axios instance, a CSRF-bearing
 * client, or a test double passes its own.
 */
export type ManifestFetcher = (url: string) => Promise<ManifestFetchResult>;

/**
 * The **optional** per-caller availability overlay (ADR-0210 §4), keyed by {@link ManifestEntry.name}.
 * The endpoint always serves the *advertised* catalog — what the vendor offers; a host that has a
 * resolver may mark which entries this caller may actually call. `<ManifestTable>` renders marks when
 * present and ignores them entirely when absent — beam-ux ships **no resolver**, and the page body
 * stays publicly cacheable either way.
 */
export type ManifestAvailability = {
    available: boolean;
    /** Optional human label for the mark ("included", "Pro"). Falls back to the component default. */
    label?: string | null;
};
