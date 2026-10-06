import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearChromeRegistry, configureEntryPage, entryPageConfig, registerLayout, resetEntryPageConfig,
    resolveLayout, SpreadTemplate, ProseTemplate, type ChromeProps,
} from '@splicewire/beam-ux/docs';
import { ApiReference } from './ApiReference.js';
import { configureDocs } from './configure.js';
import { DocsLayout } from './DocsLayout.js';

const entry = { id: 'guide', slug: 'api-keys', title: 'API keys', type: 'page', format: 'mdx', url: '/docs/api-keys' };
const props = { entry, nav: null, currentHref: '/docs/api-keys' };

beforeEach(() => {
    clearChromeRegistry();
    resetEntryPageConfig();
});

describe('explicit documentation registration', () => {
    it('leaves generic UX without a docs layout until the capability is configured', () => {
        expect(resolveLayout('DocsLayout')).toBeNull();
        expect(entryPageConfig().components?.ApiReference).toBeUndefined();
        configureDocs();
        expect(resolveLayout('DocsLayout')).toBe(DocsLayout);
        expect(entryPageConfig().components?.ApiReference).toBe(ApiReference);
    });

    it('retains host factory wrappers, other body components and registered layout overrides', () => {
        const ThemedReference = () => <div>Host Scalar wrapper</div>;
        const Other = () => <div>Other component</div>;
        const HostLayout = ({ children }: ChromeProps) => <article>{children}</article>;
        configureEntryPage({ components: { ApiReference: ThemedReference, Other } });
        registerLayout('DocsLayout', HostLayout);
        configureDocs();
        // The host's entries survive; configureDocs adds the guide kit beside them (DOCS-12).
        expect(entryPageConfig().components).toMatchObject({ ApiReference: ThemedReference, Other });
        expect(resolveLayout('DocsLayout')).toBe(HostLayout);
    });
});

describe('DocsLayout', () => {
    it('gives a spread reference the viewport and keeps the rail beside a prose guide', () => {
        const { container, rerender } = render(
            <DocsLayout {...props}><SpreadTemplate {...props}><div>Reference</div></SpreadTemplate></DocsLayout>,
        );
        const style = (selector: string) => getComputedStyle(container.querySelector(selector)!);
        expect(style('.beam-docs-rail').display).toBe('none');
        expect(style('.beam-docs-aside').display).toBe('none');
        expect(style('.beam-docs-body').maxWidth).toBe('none');
        rerender(<DocsLayout {...props}><ProseTemplate {...props}><p>Guide</p></ProseTemplate></DocsLayout>);
        expect(style('.beam-docs-rail').display).not.toBe('none');
    });

    it('derives the rail from the current section after the docs root moves', () => {
        render(<DocsLayout {...props} currentHref="/learn/beam/api-keys" nav={{ items: [
            { title: 'Pricing', href: '/pricing' },
            { title: 'Docs', href: '/learn/beam', children: [{ title: 'API keys', href: '/learn/beam/api-keys' }] },
        ] }}><p>Guide</p></DocsLayout>);
        expect(screen.getByRole('link', { name: 'API keys' }).getAttribute('href')).toBe('/learn/beam/api-keys');
        expect(screen.queryByText('Pricing')).toBeNull();
    });
});

/*
 * docs-walkthrough DOCS-12 (DM4, DOC-7, DOC-8): every docs page draws ONE packaged header from the server's
 * `docsChrome` (the product's brand and home, Back to the product's site page, the root's surfaces, the product
 * switcher), with search, appearance and author controls as slots. A host's `slots.header` no longer reaches a page
 * that carries `docsChrome`. Under 60rem the rail is a drawer the header opens.
 */
describe('DocsLayout packaged header', () => {
    const docsChrome = {
        brand: { name: 'Splicewire', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '', contact: { sales: null }, home: 'https://splicewire.test/', tagline: null },
        home: '/docs',
        back: 'https://splicewire.test/',
        surfaces: [{ label: 'API Reference', href: '/docs/api' }, { label: 'MCP Server', href: '/docs/mcp' }],
        related: [{ key: 'beam', name: 'Beam', tagline: 'Build your own app on Beam', href: 'https://splicewire.test/beam', docs: null }],
    };
    const withChrome = { ...props, page: { docsChrome } };

    it('draws the brand, Back to the product site, the surfaces and the switcher from docsChrome', () => {
        const { container } = render(
            <DocsLayout {...withChrome} slots={{ header: <div>HOST HEADER</div>, search: <input aria-label="Search docs" />, appearance: <button>Theme</button>, headerActions: <button>Edit</button> }}>
                <p>Guide</p>
            </DocsLayout>,
        );
        const header = container.querySelector('[data-docs-header]')!;

        expect(header.querySelector('a[data-docs-home]')?.getAttribute('href')).toBe('/docs');
        expect(header.querySelector('[data-docs-home]')?.textContent).toContain('Splicewire');
        expect(header.querySelector('a[data-docs-back]')?.getAttribute('href')).toBe('https://splicewire.test/');
        expect([...header.querySelectorAll('[data-docs-surface]')].map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
            ['API Reference', '/docs/api'],
            ['MCP Server', '/docs/mcp'],
        ]);
        expect(header.querySelector('[data-docs-switcher]')).not.toBeNull();
        expect(screen.getByLabelText('Search docs')).not.toBeNull();
        expect(screen.getByText('Theme')).not.toBeNull();
        expect(screen.getByText('Edit')).not.toBeNull();
        expect(screen.queryByText('HOST HEADER')).toBeNull();
    });

    it('marks the surface the reader is in', () => {
        const { container } = render(<DocsLayout {...withChrome} currentHref="/docs/api/operations"><p>Ref</p></DocsLayout>);
        const current = [...container.querySelectorAll('[data-docs-surface][aria-current="page"]')].map((a) => a.textContent);
        expect(current).toEqual(['API Reference']);
    });

    it('keeps a host header where the server sends no docsChrome', () => {
        render(<DocsLayout {...props} slots={{ header: <div>HOST HEADER</div> }}><p>Guide</p></DocsLayout>);
        expect(screen.getByText('HOST HEADER')).not.toBeNull();
    });

    it('opens the rail as a drawer from the header and closes it on Escape', () => {
        const { container } = render(<DocsLayout {...withChrome}><p>Guide</p></DocsLayout>);
        const root = container.querySelector('.beam-docs')!;
        const menu = container.querySelector<HTMLButtonElement>('[data-docs-drawer-toggle]')!;

        expect(root.hasAttribute('data-drawer-open')).toBe(false);
        fireEvent.click(menu);
        expect(root.hasAttribute('data-drawer-open')).toBe(true);
        expect(menu.getAttribute('aria-expanded')).toBe('true');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(root.hasAttribute('data-drawer-open')).toBe(false);
    });
});

/*
 * docs-walkthrough D-A4 §1, folded into DOCS-12: the guide kit is contributed by configureDocs, as ApiReference already
 * is, so no host re-types it. A host's own entry still wins.
 */
describe('configureDocs contributes the guide kit', () => {
    it('adds the beam-mdx kit components and keeps a host override', () => {
        const HostCallout = () => null;
        configureEntryPage({ components: { Callout: HostCallout } });
        configureDocs();

        const components = entryPageConfig().components ?? {};
        for (const name of ['Figure', 'FileTree', 'Terminal', 'Steps', 'Step', 'DoctorOutput', 'SectionLanding', 'CardGrid', 'Card']) {
            expect(components[name], name).toBeTypeOf('function');
        }
        expect(components.Callout).toBe(HostCallout);
    });
});

/*
 * docs-walkthrough DOCS-13 (DM5): the header's appearance slot holds the packaged toggle, which drives the ONE appearance
 * (`.dark` and `color-scheme` on <html>). A host's own `appearance` slot replaces it. The rail reads the --beam-* family,
 * never the host's dark-rail `--sidebar-*` ink (the invisible rail of shots 23/35).
 */
describe('DocsLayout appearance and rail', () => {
    const docsChrome = {
        brand: { name: 'Splicewire', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '', contact: { sales: null }, home: '/', tagline: null },
        home: '/docs', back: '/', surfaces: [], related: [],
    };
    const withChrome = { ...props, page: { docsChrome } };

    it('toggles the one appearance from the header', () => {
        localStorage.setItem('appearance', 'light');
        configureDocs();
        render(<DocsLayout {...withChrome}><p>Guide</p></DocsLayout>);
        const toggle = screen.getByRole('button', { name: /appearance/i });

        fireEvent.click(toggle);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.style.colorScheme).toBe('dark');
        fireEvent.click(toggle);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('yields to a host appearance slot', () => {
        render(<DocsLayout {...withChrome} slots={{ appearance: <button>Host theme</button> }}><p>Guide</p></DocsLayout>);
        expect(screen.queryByRole('button', { name: /appearance/i })).toBeNull();
        expect(screen.getByText('Host theme')).not.toBeNull();
    });

    it('colours the rail from the --beam-* family', async () => {
        const { DOCS_LAYOUT_CSS } = await import('./layout-css.js');
        const rail = DOCS_LAYOUT_CSS.slice(DOCS_LAYOUT_CSS.indexOf('.beam-docs-rail a'));
        expect(rail).toMatch(/color:\s*var\(--beam-/);
        expect(DOCS_LAYOUT_CSS).not.toMatch(/var\(--sidebar-/);
    });
});
