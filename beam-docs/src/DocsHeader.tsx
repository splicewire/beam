import type { ReactNode } from 'react';
import type { ChromeProps, ChromeSlots } from '@splicewire/beam-ux/docs';
import type { DocsChromeData } from './generated/types.js';
import { ProductSwitcher } from './ProductSwitcher.js';

type LinkComponent = NonNullable<ChromeProps['linkComponent']>;

/**
 * The packaged docs header (docs-walkthrough DM4, DOC-7), drawn from the server's `DocsChromeData` so no host spells one:
 * the product's mark and name (linking the docs home), the root's surfaces, Back to the product's site page, and the
 * product switcher. Search and the appearance toggle are slots that DOCS-14 and DOCS-13 fill; `headerActions` is the one
 * hole a host keeps, for author-only controls. Under 60rem a menu button opens the rail as a drawer.
 */
export function DocsHeader({
    chrome,
    currentHref,
    slots,
    linkComponent,
    drawerOpen,
    onToggleDrawer,
}: {
    chrome: DocsChromeData;
    currentHref?: string;
    slots?: ChromeSlots;
    linkComponent?: LinkComponent;
    drawerOpen: boolean;
    onToggleDrawer: () => void;
}) {
    const Link = (linkComponent ?? PlainLink) as typeof PlainLink;
    const inSurface = (href: string) => !!currentHref && (currentHref === href || currentHref.startsWith(`${href}/`));

    return (
        <header className="beam-docs-header" data-docs-header="">
            <button
                type="button"
                className="beam-docs-drawer-toggle"
                data-docs-drawer-toggle=""
                aria-label="Docs sections"
                aria-expanded={drawerOpen}
                onClick={onToggleDrawer}
            >
                ☰
            </button>
            <Link href={chrome.home} className="beam-docs-brand" {...{ 'data-docs-home': '' }}>
                {chrome.brand.logo && <img src={chrome.brand.logo} alt="" />}
                <span>{chrome.brand.name} Docs</span>
            </Link>
            <nav className="beam-docs-surfaces" aria-label="Docs surfaces">
                {chrome.surfaces.map((surface) => (
                    <Link
                        key={surface.href}
                        href={surface.href}
                        aria-current={inSurface(surface.href) ? 'page' : undefined}
                        {...{ 'data-docs-surface': '' }}
                    >
                        {surface.label}
                    </Link>
                ))}
            </nav>
            <div className="beam-docs-header-end">
                {slots?.search}
                {slots?.appearance}
                {slots?.headerActions}
                <ProductSwitcher related={chrome.related} />
                <a href={chrome.back} className="beam-docs-back" data-docs-back="">
                    ← Back to {chrome.brand.name}
                </a>
            </div>
        </header>
    );
}

const PlainLink = ({ href, className, children, ...rest }: { href: string; className?: string; children?: ReactNode }) => (
    <a href={href} className={className} {...rest}>
        {children}
    </a>
);
