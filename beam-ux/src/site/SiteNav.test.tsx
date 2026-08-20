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

const treeNav: SiteNavData = {
    items: [
        { title: 'Home', href: '/' },
        {
            title: 'Docs',
            href: '/beam/docs/',
            children: [
                {
                    title: 'Reference',
                    href: '/beam/docs/reference',
                    children: [{ title: 'API', href: '/beam/docs/reference/api' }],
                },
                { title: 'Guides', href: '/beam/docs/guides' },
            ],
        },
    ],
};

describe('SiteNav — subtree + nesting (ADR-0210 §5)', () => {
    it('stays a flat fragment of links by default, even when the projection carries a tree', () => {
        const { container } = render(<SiteNav nav={treeNav} />);
        expect(container.querySelectorAll('ul').length).toBe(0);
        expect(container.querySelectorAll('a').length).toBe(2);
        expect(screen.queryByRole('link', { name: 'Guides' })).toBeNull();
    });

    it('rootPath selects the subtree under the matched node, ignoring a trailing slash', () => {
        render(<SiteNav nav={treeNav} rootPath="/beam/docs" maxDepth={2} />);
        expect(screen.getByRole('link', { name: 'Reference' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Guides' })).toBeTruthy();
        // The matched node is the section you are already in — it is not rendered as its own item.
        expect(screen.queryByRole('link', { name: 'Docs' })).toBeNull();
    });

    it('renders nothing when rootPath matches no node', () => {
        const { container } = render(<SiteNav nav={treeNav} rootPath="/nope" maxDepth={3} />);
        expect(container.querySelectorAll('a').length).toBe(0);
    });

    it('nests as <ul>/<li> and stops at maxDepth', () => {
        const { container } = render(
            <SiteNav nav={treeNav} rootPath="/beam/docs" maxDepth={2} listClassName="side" />,
        );
        expect(container.querySelector('ul')?.classList.contains('side')).toBe(true);
        expect(container.querySelectorAll('li').length).toBe(3); // Reference, its API child, Guides
        expect(screen.getByRole('link', { name: 'API' })).toBeTruthy();

        const { container: shallow } = render(<SiteNav nav={treeNav} rootPath="/beam/docs" maxDepth={1} />);
        expect(shallow.querySelectorAll('ul').length).toBe(0);
        expect(shallow.querySelectorAll('a').length).toBe(2);
    });

    it('finds a docs root nested at any depth in the sitemap', () => {
        render(<SiteNav nav={treeNav} rootPath="/beam/docs/reference" maxDepth={2} />);
        expect(screen.getByRole('link', { name: 'API' })).toBeTruthy();
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
