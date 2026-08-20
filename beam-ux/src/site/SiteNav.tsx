// @splicewire/beam-ux/site — the data-driven public-site nav. Renders a projected `site` sitemap
// (the PHP NavProjector `nav` prop, ADR-0165) as either a flat row of links (the header) or a nested
// list (a docs sidebar).
//
// One component, two jobs — deliberately, instead of a near-duplicate `<DocsNav>` (ADR-0210 §5):
// `NavProjector` already returns the full recursive tree and `SiteNavItem` already carries `children`,
// so the data was always there and only this renderer was flat. `rootPath` selects a subtree of the
// ALREADY-DELIVERED projection client-side, which is what lets a docs shell get the site nav and the
// docs sidebar out of one payload and one request.
//
// The flat shape is the default and is unchanged: `maxDepth` defaults to 1 and emits a bare fragment
// of links, exactly as before. Nesting is opt-in, and only then does the render become `<ul>`/`<li>` —
// existing header navs keep their DOM byte-for-byte.
//
// Framework-neutral: the caller PASSES the `nav` (no `usePage`) and MAY inject a `linkComponent`
// (its router's `<Link>`) — absent one, links fall back to a plain `<a>`. Theme-neutral: styling
// arrives via `className` / `itemStyle`; the package bakes in no palette or fonts.
import type { CSSProperties } from 'react';
import type { LinkComponent, SiteNavData, SiteNavItem } from './types.js';

export type SiteNavProps = {
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

/** Compare hrefs ignoring a trailing slash, so `/docs` and `/docs/` name the same node. */
function samePath(a?: string | null, b?: string | null): boolean {
    if (a == null || b == null) return false;
    const trim = (value: string) => (value.length > 1 ? value.replace(/\/+$/, '') : value);
    return trim(a) === trim(b);
}

/** Depth-first search for the node at `href`, so a docs root may sit at any depth in the sitemap. */
function findNode(items: SiteNavItem[], href: string): SiteNavItem | null {
    for (const item of items) {
        if (samePath(item.href, href)) return item;
        const nested = item.children ? findNode(item.children, href) : null;
        if (nested) return nested;
    }
    return null;
}

export function SiteNav({
    nav,
    linkComponent,
    itemClassName,
    itemStyle,
    rootPath,
    maxDepth = 1,
    listClassName,
    itemWrapperClassName,
}: SiteNavProps) {
    const all = nav?.items ?? [];
    const items = rootPath ? (findNode(all, rootPath)?.children ?? []) : all;
    const Link: LinkComponent = linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);

    const link = (item: SiteNavItem, keyed: boolean) => (
        <Link
            key={keyed ? (item.href ?? item.title) : undefined}
            href={item.href ?? '#'}
            className={itemClassName}
            style={itemStyle}
        >
            {item.title}
        </Link>
    );

    // Flat: the historical shape — a bare fragment of links, no list wrapper.
    if (maxDepth <= 1) {
        return <>{items.map((item) => link(item, true))}</>;
    }

    const renderLevel = (level: SiteNavItem[], depth: number) => {
        if (level.length === 0 || depth <= 0) return null;
        return (
            <ul className={listClassName}>
                {level.map((item) => (
                    <li key={item.href ?? item.title} className={itemWrapperClassName}>
                        {link(item, false)}
                        {item.children && renderLevel(item.children, depth - 1)}
                    </li>
                ))}
            </ul>
        );
    };

    return <>{renderLevel(items, maxDepth)}</>;
}
