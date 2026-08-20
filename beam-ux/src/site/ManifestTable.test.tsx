import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ManifestTable, ManifestTableView, fetchManifest } from './ManifestTable.js';
import type { ManifestFetcher } from './types.js';

const items = [
    { name: 'knowledge_search', title: 'Search knowledge', description: 'Grounded retrieval.' },
    { name: 'compliance_disclose', title: 'Disclose', description: 'Defensible determination.' },
];

function withQuery(ui: ReactNode) {
    // A fresh client per mount: no cache bleed between cases, and retries off so the error case
    // resolves in one tick instead of react-query's default backoff.
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ManifestTableView', () => {
    it('renders the advertised entries', () => {
        render(<ManifestTableView items={items} />);
        expect(screen.getByText('knowledge_search')).toBeTruthy();
        expect(screen.getByText('Defensible determination.')).toBeTruthy();
    });

    it('renders the per-caller availability marks only when an overlay is supplied', () => {
        const { container, rerender } = render(<ManifestTableView items={items} />);
        expect(container.querySelectorAll('[data-available]').length).toBe(0);

        rerender(
            <ManifestTableView
                items={items}
                availability={{
                    knowledge_search: { available: true },
                    compliance_disclose: { available: false, label: 'Pro' },
                }}
            />,
        );
        expect(container.querySelector('[data-available="true"]')?.textContent).toBe('available');
        expect(container.querySelector('[data-available="false"]')?.textContent).toBe('Pro');
    });

    it('distinguishes an uninstalled contributor from an empty catalogue', () => {
        const { container } = render(<ManifestTableView items={[]} absent />);
        expect(container.querySelector('[data-beam-ux-manifest]')?.getAttribute('data-beam-ux-manifest')).toBe(
            'not-installed',
        );
        const { container: c2 } = render(<ManifestTableView items={[]} />);
        expect(c2.querySelector('[data-beam-ux-manifest]')?.getAttribute('data-beam-ux-manifest')).toBe('empty');
    });
});

describe('ManifestTable', () => {
    it('reads the endpoint through the injected fetcher and renders the rows', async () => {
        const fetcher: ManifestFetcher = vi.fn(async () => ({ status: 'ok' as const, items }));
        withQuery(<ManifestTable endpoint="/beam/mcp/manifest.json" fetcher={fetcher} />);

        expect(screen.getByText('Loading…')).toBeTruthy();
        await waitFor(() => expect(screen.getByText('knowledge_search')).toBeTruthy());
        expect(fetcher).toHaveBeenCalledWith('/beam/mcp/manifest.json');
    });

    it('renders the "not installed" state on absence — the page still renders (ADR-0210 §6)', async () => {
        const fetcher: ManifestFetcher = async () => ({ status: 'absent' });
        const { container } = withQuery(
            <ManifestTable endpoint="/beam/mcp/manifest.json" fetcher={fetcher} notInstalled="MCP is not installed." />,
        );
        await waitFor(() => expect(screen.getByText('MCP is not installed.')).toBeTruthy());
        expect(container.querySelector('[data-beam-ux-manifest="not-installed"]')).toBeTruthy();
    });

    it('surfaces a real failure as an error state, never as absence', async () => {
        const fetcher: ManifestFetcher = async () => {
            throw new Error('boom');
        };
        const { container } = withQuery(
            <ManifestTable endpoint="/beam/mcp/manifest.json" fetcher={fetcher} error={(e) => String(e)} />,
        );
        await waitFor(() => expect(container.querySelector('[data-beam-ux-manifest="error"]')).toBeTruthy());
        expect(screen.getByText('Error: boom')).toBeTruthy();
    });
});

describe('fetchManifest', () => {
    const stubFetch = (init: { status: number; body?: unknown }) => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                status: init.status,
                ok: init.status >= 200 && init.status < 300,
                json: async () => init.body,
            })),
        );
    };

    it('maps 404 to absence and any other failure to a throw', async () => {
        stubFetch({ status: 404 });
        expect(await fetchManifest('/x.json')).toEqual({ status: 'absent' });

        stubFetch({ status: 500 });
        await expect(fetchManifest('/x.json')).rejects.toThrow('responded 500');
        vi.unstubAllGlobals();
    });

    it('accepts both `{ items }` and a bare array, and rejects anything else', async () => {
        stubFetch({ status: 200, body: { items } });
        expect(await fetchManifest('/x.json')).toEqual({ status: 'ok', items });

        stubFetch({ status: 200, body: items });
        expect(await fetchManifest('/x.json')).toEqual({ status: 'ok', items });

        stubFetch({ status: 200, body: { tools: items } });
        await expect(fetchManifest('/x.json')).rejects.toThrow('`{ items: [] }`');
        vi.unstubAllGlobals();
    });
});
