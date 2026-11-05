import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearChromeRegistry, resetEntryPageConfig } from '@splicewire/beam-ux/docs';
import { configureDocs } from './configure.js';
import { setDocsConfiguration } from './config.js';
import { DocsLayout } from './DocsLayout.js';
import type { RegistryIndexData } from './generated/types.js';
import { REGISTRY_INDEX_KIND, RegistryIndexNav, type RegistryIndexNavNode } from './RegistryIndexNav.js';

// The shape laravel-beam-docs' RegistryDocsNav emits for `beam.docs.registries.nav.widget` = `index`
// (its RegistryIndexNavNodeTest pins the server half): a configured heading over clusters, a nested cluster,
// unserved roots with the server's note, and an external pointer.
const index: RegistryIndexData = {
    total: 7,
    groups: [
        {
            key: 'Tower operations', title: 'Tower operations', href: null, roots: [],
            groups: [
                {
                    key: 'conduit', title: 'Conduits', href: null, groups: [],
                    roots: [{ root: 'conduit', href: '/docs/registry/conduit', availability: 'not-available', note: 'not available on this host' }],
                },
                {
                    key: 'determination', title: 'Determination registries', href: null,
                    roots: [{ root: 'determination.disclosure.subjects', href: '/docs/registry/determination.disclosure.subjects', availability: 'not-available', note: 'not available on this host' }],
                    groups: [{
                        key: 'determination.corpus', title: 'Corpus', href: '/docs/registries/determination.corpus', groups: [],
                        roots: [{ root: 'determination.corpus.streams', href: '/docs/registries/determination.corpus.streams', availability: 'served', note: null }],
                    }],
                },
            ],
        },
        {
            key: 'beam.workflows', title: 'Workflow registries', href: '/docs/registries/beam.workflows', groups: [],
            roots: [
                { root: 'beam.workflows.definitions', href: '/docs/registries/beam.workflows.definitions', availability: 'served', note: null },
                { root: 'workflow', href: '/docs/registries/workflow', availability: 'served', note: null },
            ],
        },
        {
            key: 'popcorn', title: 'Popcorn', href: null, groups: [],
            roots: [{ root: 'popcorn.invocables', href: 'https://example.com/popcorn', availability: 'external', note: null }],
        },
        {
            key: 'beam', title: 'Beam core', href: null, groups: [],
            roots: [{ root: 'beam.doctor.facade-scope', href: '/docs/registry/beam.doctor.facade-scope', availability: 'exempt', note: 'no page: rebind-only' }],
        },
    ],
};

const node: RegistryIndexNavNode = { kind: REGISTRY_INDEX_KIND, title: 'Registry index', href: null, children: [], index };

beforeEach(() => {
    window.localStorage.clear();
    clearChromeRegistry();
    resetEntryPageConfig();
});
afterEach(() => vi.useRealTimers());

// A root name carries <wbr> after each dot. Chromium's accessible name is the root as spelled (the worktree-host proof
// checks it with an exact match); jsdom's name computation inserts a space at each <wbr>, so names compare without it.
const rootName = (root: string) => (name: string) => name.replace(/\s+/g, '') === root;
const header = (name: string) => screen.getByRole('button', { name });
const openSearch = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Find a registry/ }));
    await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
};

describe('RegistryIndexNav — the tree', () => {
    it('draws configured headings as tracks and clusters as collapsed disclosures', () => {
        render(<RegistryIndexNav node={node} currentHref="/docs/registries" />);

        expect(screen.getByText('Tower operations')).toBeTruthy();
        expect(screen.getByText('Other registries')).toBeTruthy();
        for (const name of ['Conduits', 'Determination registries', 'Workflow registries', 'Popcorn', 'Beam core']) {
            expect(header(name).getAttribute('aria-expanded')).toBe('false');
        }
    });

    it('opens the cluster holding the current page and marks the page current', () => {
        render(<RegistryIndexNav node={node} currentHref="/docs/registries/workflow" />);

        expect(header('Workflow registries').getAttribute('aria-expanded')).toBe('true');
        const link = screen.getByRole('link', { name: 'workflow' });
        expect(link.getAttribute('aria-current')).toBe('page');
        // The cluster page leads its disclosure, since the disclosure header itself is a toggle, not a link.
        expect(screen.getByRole('link', { name: 'Overview' }).getAttribute('href')).toBe('/docs/registries/beam.workflows');
    });

    it('toggles a disclosure from the keyboard-reachable header button', () => {
        render(<RegistryIndexNav node={node} />);

        fireEvent.click(header('Popcorn'));
        expect(header('Popcorn').getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('link', { name: rootName('popcorn.invocables') }).getAttribute('href')).toBe('https://example.com/popcorn');
    });

    it('shows an unserved root with the server’s note, as a row that is not a link', () => {
        const { container } = render(<RegistryIndexNav node={node} />);

        const row = container.querySelector('[data-registry-root="/docs/registry/conduit"]')!;
        expect(row.getAttribute('data-availability')).toBe('not-available');
        expect(row.textContent).toContain('not available on this host');
        expect(row.closest('a')).toBeNull();
        expect(screen.queryByRole('link', { name: /conduit/ })).toBeNull();
        expect(container.querySelector('[data-availability="exempt"]')!.textContent).toContain('no page: rebind-only');
    });

    it('nests a cluster inside a cluster under its page', () => {
        render(<RegistryIndexNav node={node} currentHref="/docs/registries/determination.corpus.streams" />);

        expect(header('Determination registries').getAttribute('aria-expanded')).toBe('true');
        const corpus = screen.getByRole('link', { name: 'Corpus' }).closest('.beam-registry-index-item')!;
        expect(within(corpus as HTMLElement).getByRole('link', { name: rootName('determination.corpus.streams') })).toBeTruthy();
    });

    it('draws nothing for a node that carries no index', () => {
        const { container } = render(<RegistryIndexNav node={{ ...node, index: null } as RegistryIndexNavNode} />);
        expect(container.innerHTML).toBe('');
    });
});

describe('RegistryIndexNav — the search', () => {
    it('lists every root, filters by name or group, and hints the group and the note', async () => {
        render(<RegistryIndexNav node={node} />);
        await openSearch();

        expect(screen.getAllByRole('option')).toHaveLength(7);
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tower' } });
        await act(async () => { await new Promise((r) => setTimeout(r, 5)); });

        const options = screen.getAllByRole('option');
        expect(options.map((o) => o.textContent)).toEqual([
            expect.stringContaining('conduit'),
            expect.stringContaining('determination.disclosure.subjects'),
            expect.stringContaining('determination.corpus.streams'),
        ]);
        expect(options[0].textContent).toContain('Tower operations › Conduits · not available on this host');
    });

    it('navigates to a served root chosen from the keyboard', async () => {
        const navigate = vi.fn();
        configureDocs({ navigate });
        render(<RegistryIndexNav node={node} />);
        await openSearch();

        const input = screen.getByRole('searchbox');
        fireEvent.change(input, { target: { value: 'workflow' } });
        await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(navigate).toHaveBeenCalledWith('/docs/registries/workflow');
        expect(screen.queryByRole('searchbox')).toBeNull();
    });

    it('reveals an unserved root in the tree instead of opening its JSON deep link', async () => {
        const navigate = vi.fn();
        setDocsConfiguration({ registryLinkEndpoint: null, navigate });
        const { container } = render(<RegistryIndexNav node={node} />);
        await openSearch();

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'conduit' } });
        await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
        fireEvent.click(screen.getByRole('option'));

        expect(navigate).not.toHaveBeenCalled();
        expect(header('Conduits').getAttribute('aria-expanded')).toBe('true');
        const row = container.querySelector('[data-registry-root="/docs/registry/conduit"]')!;
        expect(row.hasAttribute('data-revealed')).toBe(true);
        expect(document.activeElement).toBe(row);
    });

    it('closes on Escape and hands focus back to the trigger', async () => {
        render(<RegistryIndexNav node={node} />);
        await openSearch();

        fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });

        expect(screen.queryByRole('searchbox')).toBeNull();
        expect(document.activeElement).toBe(screen.getByRole('button', { name: /Find a registry/ }));
    });

    it('closes on Escape pressed while the trigger still holds focus', async () => {
        render(<RegistryIndexNav node={node} />);
        await openSearch();
        const trigger = screen.getByRole('button', { name: /Find a registry/ });

        fireEvent.keyDown(trigger, { key: 'Escape' });

        expect(screen.queryByRole('searchbox')).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });
});

describe('DocsLayout — the registry index kind in the rail', () => {
    it('draws a registry-index node with the packaged widget, beside the ordinary rows', () => {
        const nav = {
            items: [{
                kind: 'nav/link', title: 'Docs', href: '/docs',
                children: [{
                    kind: 'nav/link', title: 'Registries', href: '/docs/registries',
                    children: [{ kind: 'nav/link', title: 'Foundations', href: '/docs/foundations', children: [] }, node],
                }],
            }],
        };
        const { container } = render(
            <DocsLayout entry={{ id: 'r', slug: 'workflow', title: 'workflow', type: 'page', format: 'mdx', url: '/docs/registries/workflow' }}
                nav={nav as never} currentHref="/docs/registries/workflow">
                <p>body</p>
            </DocsLayout>,
        );

        const rail = container.querySelector('.beam-docs-rail')!;
        expect(rail.querySelector(`[data-kind="${REGISTRY_INDEX_KIND}"] [data-registry-index]`)).not.toBeNull();
        expect(within(rail as HTMLElement).getByRole('link', { name: 'Foundations' })).toBeTruthy();
        expect(within(rail as HTMLElement).getByRole('link', { name: rootName('workflow') }).getAttribute('aria-current')).toBe('page');
    });

    it('lets a host redraw the kind through configureDocs({ navKinds })', () => {
        configureDocs({ navKinds: { [REGISTRY_INDEX_KIND]: () => <div data-testid="host-index" /> } });
        render(
            <DocsLayout entry={{ id: 'r', slug: 'r', title: 'r', type: 'page', format: 'mdx', url: '/docs/r' }}
                nav={{ items: [node] } as never} currentHref="/docs/r">
                <p>body</p>
            </DocsLayout>,
        );

        expect(screen.getByTestId('host-index')).toBeTruthy();
        expect(document.querySelector('[data-registry-index]')).toBeNull();
    });
});
