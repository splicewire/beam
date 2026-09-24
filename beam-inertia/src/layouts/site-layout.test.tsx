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
    SiteLayout: ({
        footerLinks,
        children,
        className,
        head,
    }: {
        footerLinks: { title: string; href: string }[];
        children?: ReactNode;
        className?: string;
        head?: ReactNode;
    }) => (
        <>
            {head}
            <div data-testid="site-root" className={className} />
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

import SiteLayout, { siteThemeCss } from './site-layout';

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

/**
 * The dark variant (theme `site.dark*`): the chrome paints through `--st-*` variables that `.st-site`
 * binds to the light slots and `.dark .st-site` / `.st-site.dark` bind to the dark ones, so the site
 * follows the same stored appearance, and the same system fallback, as the app shell.
 */
function stubScheme(systemDark: boolean, stored: string | null) {
    window.localStorage.clear();
    if (stored !== null) window.localStorage.setItem('appearance', stored);
    window.matchMedia = ((query: string) => ({
        matches: systemDark && query.includes('dark'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
}

it('emits both schemes of a resolved theme.site as --theme-site-* declarations', () => {
    const css = siteThemeCss({
        background: '#f8fafc',
        foreground: '#0f172a',
        muted: '#475569',
        accent: '#0f172a',
        accentHover: '#1e293b',
        border: 'rgba(15,23,42,.08)',
        darkBackground: '#0b0f17',
        darkAccentForeground: '#0b0f17',
    });

    expect(css).toContain('--theme-site-background:#f8fafc;');
    expect(css).toContain('--theme-site-dark-background:#0b0f17;');
    expect(css).toContain('--theme-site-dark-accent-foreground:#0b0f17;');
    // An absent slot is not declared, so the layout's own fallback applies rather than an empty value.
    expect(css).not.toContain('--theme-site-dark-muted');
});

it('re-binds the chrome to the dark slots under the app .dark class and keeps the editor canvas light', () => {
    stubScheme(false, 'light');
    props.value = { auth: { user: null } };

    const { container } = render(<SiteLayout>page</SiteLayout>);
    const sheet = [...container.querySelectorAll('style')].map((style) => style.innerHTML).join('\n');

    expect(sheet).toContain('.dark .st-site,.st-site.dark{');
    expect(sheet).toContain('--st-bg:var(--theme-site-dark-background, #0b0f17);');
    expect(sheet).toContain('.st-site,.st-site .ve-canvas{');
    expect(sheet).toContain('.st-site .btn-primary{');
    expect(sheet).toContain('color:var(--st-accent-fg)');
});

it('renders dark when the visitor has no stored preference and the system prefers dark', async () => {
    vi.resetModules();
    stubScheme(true, null);
    const { default: Layout } = await import('./site-layout');
    props.value = { auth: { user: null } };

    render(<Layout>page</Layout>);

    expect(screen.getByTestId('site-root').className).toBe('st-site dark');
});

it('stays light when the stored appearance is light, whatever the system prefers', async () => {
    vi.resetModules();
    stubScheme(true, 'light');
    const appearance = await import('../hooks/use-appearance');
    appearance.initializeTheme();
    const { default: Layout } = await import('./site-layout');
    props.value = { auth: { user: null } };

    render(<Layout>page</Layout>);

    expect(screen.getByTestId('site-root').className).toBe('st-site');
});

it('renders dark when the app toggle stored dark on a light system', async () => {
    vi.resetModules();
    stubScheme(false, 'dark');
    const appearance = await import('../hooks/use-appearance');
    appearance.initializeTheme();
    const { default: Layout } = await import('./site-layout');
    props.value = { auth: { user: null } };

    render(<Layout>page</Layout>);

    expect(screen.getByTestId('site-root').className).toBe('st-site dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
});
