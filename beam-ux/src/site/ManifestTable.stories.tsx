import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ManifestTable } from './ManifestTable';
import type { ManifestEntry, ManifestFetchResult, ManifestFetcher } from './types';

/**
 * Catalog stories for {@link ManifestTable} (beam-docs-satellite ticket 20, ADR-0210 §5) — the generic
 * surface a contributing beam package's docs page renders. Its axes are the **read outcome** (loading /
 * ok / not-installed / error) and the presence of the optional per-caller availability overlay. The
 * transport is the injected `fetcher`, so every state is deterministic and nothing hits the network.
 */
const meta = {
    title: 'BeamUx/Site/ManifestTable',
    component: ManifestTable,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof ManifestTable>;

export default meta;

const tools: ManifestEntry[] = [
    {
        name: 'knowledge_search',
        title: 'Search knowledge',
        description: 'Grounded retrieval over the tenant knowledge base, with traceable citations.',
    },
    {
        name: 'knowledge_read',
        title: 'Read a document',
        description: 'Fetch one grounded source in full.',
    },
    {
        name: 'compliance_disclose',
        title: 'Disclose',
        description: 'Turn a declaration into a defensible determination.',
    },
];

const fetcherOf =
    (result: ManifestFetchResult): ManifestFetcher =>
    () =>
        Promise.resolve(result);

const hangingFetcher: ManifestFetcher = () => new Promise(() => {});

const failingFetcher: ManifestFetcher = () => Promise.reject(new Error('502 Bad Gateway'));

/** A fresh QueryClient per mount keeps the catalog isolated (no cache bleed between stories). */
function Harness({ children }: { children: ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** The advertised catalog — what the vendor OFFERS, with no per-caller narrowing (ADR-0210 §4). */
export const Advertised: StoryObj = {
    render: () => (
        <Harness>
            <ManifestTable endpoint="/beam/mcp/manifest.json" fetcher={fetcherOf({ status: 'ok', items: tools })} />
        </Harness>
    ),
};

/** A host that HAS a resolver supplies marks; beam-ux ships none, and the page stays cacheable. */
export const WithAvailabilityOverlay: StoryObj = {
    render: () => (
        <Harness>
            <ManifestTable
                endpoint="/beam/mcp/manifest.json"
                fetcher={fetcherOf({ status: 'ok', items: tools })}
                availability={{
                    knowledge_search: { available: true },
                    knowledge_read: { available: true },
                    compliance_disclose: { available: false, label: 'Pro' },
                }}
            />
        </Harness>
    ),
};

/** Contributor uninstalled, site-owned page survives: an inline empty state, and the page still 200s. */
export const NotInstalled: StoryObj = {
    render: () => (
        <Harness>
            <ManifestTable
                endpoint="/beam/mcp/manifest.json"
                fetcher={fetcherOf({ status: 'absent' })}
                notInstalled="The MCP server is not installed on this site."
            />
        </Harness>
    ),
};

/** A real failure is NOT absence — the two states are deliberately distinguishable. */
export const Failed: StoryObj = {
    render: () => (
        <Harness>
            <ManifestTable
                endpoint="/beam/mcp/manifest.json"
                fetcher={failingFetcher}
                error={(err) => `Could not load the tool list — ${String(err)}`}
            />
        </Harness>
    ),
};

export const Loading: StoryObj = {
    render: () => (
        <Harness>
            <ManifestTable endpoint="/beam/mcp/manifest.json" fetcher={hangingFetcher} />
        </Harness>
    ),
};
