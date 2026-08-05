import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteNav } from './SiteNav.js';
import { SiteLayout } from './SiteLayout.js';
import type { LinkComponent, SiteNavData } from './types.js';

const nav: SiteNavData = {
    items: [
        { title: 'Home', href: '/' },
        { title: 'Discover', href: '/discover' },
        { title: 'Studio', href: '/studio' },
    ],
};

describe('SiteNav', () => {
    it('renders the projected top-level items as links', () => {
        render(<SiteNav nav={nav} />);
        expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
        expect(screen.getByRole('link', { name: 'Discover' }).getAttribute('href')).toBe('/discover');
        expect(screen.getByRole('link', { name: 'Studio' }).getAttribute('href')).toBe('/studio');
    });

    it('renders nothing when nav is absent or empty', () => {
        const { container } = render(<SiteNav nav={null} />);
        expect(container.querySelectorAll('a').length).toBe(0);
        const { container: c2 } = render(<SiteNav nav={{ items: [] }} />);
        expect(c2.querySelectorAll('a').length).toBe(0);
    });

    it('routes through an injected linkComponent instead of a plain <a>', () => {
        const Link: LinkComponent = ({ href, children, ...rest }) => (
            <a data-router="1" href={href} {...rest}>
                {children}
            </a>
        );
        render(<SiteNav nav={nav} linkComponent={Link} itemClassName="navlink" />);
        const home = screen.getByRole('link', { name: 'Home' });
        expect(home.getAttribute('data-router')).toBe('1');
        expect(home.classList.contains('navlink')).toBe(true);
    });
});

describe('SiteLayout', () => {
    it('composes brand + nav in the header and children in main', () => {
        render(
            <SiteLayout brand={<span>wordmark</span>} nav={<SiteNav nav={nav} />}>
                <p>page body</p>
            </SiteLayout>,
        );
        // Brand falls through to the footer too (footerBrand ?? brand), so it appears twice.
        expect(screen.getAllByText('wordmark').length).toBeGreaterThan(0);
        expect(screen.getByText('page body')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Studio' })).toBeTruthy();
    });

    it('renders footer links, honoring external vs. routed', () => {
        render(
            <SiteLayout
                footerLinks={[
                    { title: 'Privacy', href: '/privacy' },
                    { title: 'Email', href: 'mailto:hi@example.test', external: true },
                ]}
            >
                <p>body</p>
            </SiteLayout>,
        );
        expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
        expect(screen.getByRole('link', { name: 'Email' }).getAttribute('href')).toBe('mailto:hi@example.test');
    });

    it('escape hatches replace the whole header/footer', () => {
        render(
            <SiteLayout
                brand={<span>ignored-brand</span>}
                header={<header>custom head</header>}
                footer={<footer>custom foot</footer>}
            >
                <p>body</p>
            </SiteLayout>,
        );
        expect(screen.getByText('custom head')).toBeTruthy();
        expect(screen.getByText('custom foot')).toBeTruthy();
        expect(screen.queryByText('ignored-brand')).toBeNull();
    });
});
