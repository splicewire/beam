// @splicewire/beam-ux/site — the data-driven public-site nav. Renders the top-level items of a
// projected `site` sitemap (the PHP NavProjector `nav` prop, ADR-0165) as a flat row of links.
//
// Framework-neutral: the caller PASSES the `nav` (no `usePage`) and MAY inject a `linkComponent`
// (its router's `<Link>`) — absent one, links fall back to a plain `<a>`. Theme-neutral: styling
// arrives via `className` / `itemStyle`; the package bakes in no palette or fonts.
import type { CSSProperties } from 'react';
import type { LinkComponent, SiteNavData } from './types.js';

export type SiteNavProps = {
    /** The projected `site` sitemap. Its top-level `items` render as the nav row. */
    nav?: SiteNavData | null;
    /** Router link component (e.g. Inertia `Link`). Defaults to a plain `<a>`. */
    linkComponent?: LinkComponent;
    /** Class applied to every rendered link (host theme hooks its selector here). */
    itemClassName?: string;
    /** Inline style applied to every rendered link. */
    itemStyle?: CSSProperties;
};

export function SiteNav({ nav, linkComponent, itemClassName, itemStyle }: SiteNavProps) {
    const items = nav?.items ?? [];
    const Link: LinkComponent = linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);

    return (
        <>
            {items.map((item) => (
                <Link
                    key={item.href ?? item.title}
                    href={item.href ?? '#'}
                    className={itemClassName}
                    style={itemStyle}
                >
                    {item.title}
                </Link>
            ))}
        </>
    );
}
