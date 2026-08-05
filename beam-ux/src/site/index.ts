/**
 * `@splicewire/beam-ux/site` — generic public-site chrome (beam-ux-uplift ticket 10).
 *
 * So a fresh beam host gets marketing + legal-page chrome OOTB. Two portable, theme-neutral,
 * framework-neutral surfaces:
 *   - {@link SiteLayout} — a slot-based header / main / footer shell (brand + nav + footer-links as
 *     props/slots, per-slot class+style theme hooks, whole-header/footer escape hatches).
 *   - {@link SiteNav} — a flat, data-driven nav that renders the top-level items of the projected
 *     `site` sitemap (the PHP `NavProjector` `nav` prop, ADR-0165).
 *
 * The package ships NO palette, fonts, or wordmark and imports NO router — a host supplies its theme
 * via className/style/CSS-vars and injects its `<Link>` through `linkComponent`. The Analog-Studio
 * ember theme stays host-local (audiostud collapses its `site-layout.tsx` to a thin token wrapper).
 */

export { SiteLayout, type SiteLayoutProps, type SiteFooterLink } from './SiteLayout.js';
export { SiteNav, type SiteNavProps } from './SiteNav.js';
export type { SiteNavItem, SiteNavData, LinkComponent } from './types.js';
