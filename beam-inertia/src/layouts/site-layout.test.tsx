// @vitest-environment jsdom
/**
 * The footer's content links come from the same `nav` prop the header's SiteNav reads (the `site` sitemap,
 * `resources/beam-ux/nav.yml`). They were a hardcoded Home/About list, so renaming the About page's nav
 * title changed the header and left the footer reading "About" (G2-BEAM-THEME-NAV, overnight-polish 02).
 */
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

const props = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
    usePage: () => ({ props: props.value }),
}));
vi.mock('@splicewire/beam-ux/site', () => ({
    SiteLayout: ({ footerLinks, children }: { footerLinks: { title: string; href: string }[]; children?: ReactNode }) => (
        <>
            {children}
            <footer>
                {footerLinks.map((link) => (
                    <a key={link.href} href={link.href}>
                        {link.title}
                    </a>
                ))}
            </footer>
        </>
    ),
    SiteNav: () => null,
}));
vi.mock('../components/app-logo-icon', () => ({ default: () => null }));
vi.mock('../components/site-nav', () => ({ default: () => null }));

import SiteLayout from './site-layout';

afterEach(cleanup);

it('lists the footer content links from the site nav, so a renamed nav title shows there too', () => {
    props.value = {
        auth: { user: null },
        nav: { items: [{ title: 'Home', href: '/' }, { title: 'About 1727158000', href: '/about' }] },
    };

    const { container } = render(<SiteLayout>page</SiteLayout>);
    const footer = container.querySelector('footer')!;

    expect([...footer.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
        'Home',
        'About 1727158000',
        'Sign in',
    ]);
});
