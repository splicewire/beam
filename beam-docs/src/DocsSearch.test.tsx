import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearChromeRegistry, resetEntryPageConfig } from '@splicewire/beam-ux/docs';
import { configureDocs } from './configure.js';
import { DocsLayout } from './DocsLayout.js';

/**
 * docs-walkthrough DOCS-14 (DM6, DOC-9): the packaged header's search box queries `docs.search` for the docs root the
 * page is in, lists the hits (the API reference surface labelled as such) and, on a miss, offers the related product's
 * docs. A host's own `search` slot replaces it; `searchEndpoint: null` turns it off.
 */
const docsChrome = {
    brand: { name: 'Splicewire', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '', contact: { sales: null }, home: '/', tagline: null },
    home: '/docs',
    back: '/',
    surfaces: [],
    related: [],
};
const entry = { id: 'g', slug: 'guide', title: 'Guide', type: 'page', format: 'mdx', url: '/docs/guide' };
const props = { entry, nav: null, currentHref: '/docs/guide', page: { docsChrome } };

let calls: string[] = [];
let respond: (url: string) => unknown;

beforeEach(() => {
    vi.useFakeTimers();
    clearChromeRegistry();
    resetEntryPageConfig();
    calls = [];
    respond = () => ({ data: { results: [], fallback: null } });
    configureDocs({ transport: async (url) => { calls.push(url); return respond(url); } });
    window.history.replaceState(null, '', '/docs/guide');
});
afterEach(() => vi.useRealTimers());

const type = async (value: string) => {
    fireEvent.change(screen.getByLabelText('Search docs'), { target: { value } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
};

describe('DocsSearch', () => {
    it('asks docs.search for this root and lists the hits, the reference surface labelled', async () => {
        respond = () => ({ data: {
            results: [
                { title: 'Install a paid extension', href: '/docs/build/install', trail: ['Build'], excerpt: 'Buy it, then install it.', kind: 'page' },
                { title: 'API Reference', href: '/docs/api', trail: [], excerpt: null, kind: 'reference' },
            ],
            fallback: null,
        } });
        render(<DocsLayout {...props}><p>Guide</p></DocsLayout>);
        await type('install');

        expect(calls).toEqual(['/beam/docs/search?q=install&root=%2Fdocs']);
        const hits = [...document.querySelectorAll('[data-docs-search-hit]')].map((a) => [a.textContent, a.getAttribute('href')]);
        expect(hits[0][0]).toContain('Install a paid extension');
        expect(hits[0][0]).toContain('Build');
        expect(hits[0][1]).toBe('/docs/build/install');
        expect(document.querySelector('[data-docs-search-hit][data-kind="reference"]')?.textContent).toContain('API Reference');
    });

    it('offers the related product’s docs on a miss', async () => {
        respond = () => ({ data: { results: [], fallback: { label: 'Search Beam docs', href: '/beam/docs?q=quasar' } } });
        render(<DocsLayout {...props}><p>Guide</p></DocsLayout>);
        await type('quasar');

        expect(screen.getByText('Search Beam docs').closest('a')?.getAttribute('href')).toBe('/beam/docs?q=quasar');
    });

    it('searches the query a fallback link carried in ?q= on arrival', async () => {
        window.history.replaceState(null, '', '/docs?q=setup');
        render(<DocsLayout {...props} currentHref="/docs"><p>Root</p></DocsLayout>);
        await act(async () => { await vi.advanceTimersByTimeAsync(300); });

        expect(calls).toEqual(['/beam/docs/search?q=setup&root=%2Fdocs']);
        expect((screen.getByLabelText('Search docs') as HTMLInputElement).value).toBe('setup');
    });

    it('yields to a host search slot, and is off with searchEndpoint null', () => {
        const { unmount } = render(<DocsLayout {...props} slots={{ search: <input aria-label="Host search" /> }}><p>Guide</p></DocsLayout>);
        expect(screen.queryByLabelText('Search docs')).toBeNull();
        expect(screen.getByLabelText('Host search')).not.toBeNull();
        unmount();

        configureDocs({ searchEndpoint: null });
        render(<DocsLayout {...props}><p>Guide</p></DocsLayout>);
        expect(screen.queryByLabelText('Search docs')).toBeNull();
    });
});
