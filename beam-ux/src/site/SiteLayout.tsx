// @splicewire/beam-ux/site — a generic, slot-based chrome for a beam public site (marketing +
// legal/marketing MDX). Header (brand + nav) / main / footer (brand + links), each a SLOT, so a
// host composes the exact affordances it wants and NOTHING is hardcoded.
//
// Theme-neutral by contract: the package ships NO palette, fonts, or wordmark. A host supplies its
// look through `className` / `style` (+ the per-slot class hooks) or CSS-var overrides — the
// Analog-Studio ember theme, Fraunces fonts, and the `audiostud.io` wordmark stay HOST-LOCAL. A
// second host restyles the same structure with its own tokens.
import type { CSSProperties, ReactNode } from 'react';
import type { LinkComponent } from './types.js';

export type SiteFooterLink = {
    title: string;
    href: string;
    /** External (`<a href>`, e.g. `mailto:`) vs. routed through `linkComponent`. */
    external?: boolean;
};

export type SiteLayoutProps = {
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

    // Theme hooks — every wrapper takes a class + style so a host CSS layer / token set drives look.
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

export function SiteLayout({
    children,
    brand,
    nav,
    footerBrand,
    footerLinks,
    linkComponent,
    header,
    footer,
    head,
    className,
    style,
    headerClassName,
    headerStyle,
    mainClassName,
    mainStyle,
    footerClassName,
    footerStyle,
    footerLinkClassName,
    footerLinkStyle,
}: SiteLayoutProps) {
    const Link: LinkComponent = linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);

    return (
        <>
            {head}
            <div className={className} style={style}>
                {header ?? (
                    <header className={headerClassName} style={headerStyle}>
                        {brand}
                        {nav}
                    </header>
                )}

                <main className={mainClassName} style={mainStyle}>
                    {children}
                </main>

                {footer ?? (
                    <footer className={footerClassName} style={footerStyle}>
                        {footerBrand ?? brand}
                        {footerLinks && footerLinks.length > 0 && (
                            <div>
                                {footerLinks.map((link) =>
                                    link.external ? (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            className={footerLinkClassName}
                                            style={footerLinkStyle}
                                        >
                                            {link.title}
                                        </a>
                                    ) : (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={footerLinkClassName}
                                            style={footerLinkStyle}
                                        >
                                            {link.title}
                                        </Link>
                                    ),
                                )}
                            </div>
                        )}
                    </footer>
                )}
            </div>
        </>
    );
}
