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
    /** Nested nav nodes, if the projection carries a tree. Unused by the flat `<SiteNav>`. */
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
