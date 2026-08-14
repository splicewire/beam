import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
// Import through the package barrel — the same entry a host consumes.
import {
    ExtensionsArea,
    ExtensionsCatalog,
    ExtensionsProvider,
    InstalledTab,
    type ExtensionsCatalogRead,
    type ExtensionsClient,
    type InstalledExtension,
} from '../src/index';

beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.scrollIntoView ??= () => {};
});

// The §8a bar: pure generated-DTO-shaped fixtures so the render can't drift from the real
// projected shape (ADR-0116 §7a — an isolation mount off a pure fixture, no Laravel).
// ticket 08 REVISION: one unified `MarketExtension` shape now serves both the catalog row and the
// detail sheet (no more `facets`/`connected` on the catalog envelope, no more `.summary` wrapper on
// the detail response — `connected` moves to its own `getConnectionStatus()` fixture below).
const CATALOG: ExtensionsCatalogRead = {
    listings: [
        {
            id: 1,
            name: 'Acme Waveform',
            kind: 'beam_extension',
            trustTier: 'Official',
            requiresSplicewire: true,
            isPlatformTier: false,
            isInstalled: false,
            isFree: false,
            priceLabel: '$19.99',
            categories: ['Productivity'],
            sellerName: 'Acme',
            installCount: 4,
            description: 'A test listing.',
            changelog: [],
            createdAt: '2026-08-01T00:00:00Z',
        },
        {
            id: 2,
            name: 'Satellite',
            kind: 'beam_extension',
            trustTier: 'Official',
            requiresSplicewire: true,
            isPlatformTier: true,
            isInstalled: true,
            isFree: true,
            priceLabel: null,
            categories: ['Platform Tier'],
            sellerName: 'Splicewire',
            installCount: 1,
            description: null,
            changelog: [],
            createdAt: '2026-08-01T00:00:00Z',
        },
    ],
};

const DISCONNECTED_STATUS = {
    connected: false,
    pairingGuidance: {
        connectCommand: 'php artisan splicewire:connect',
        manualTokenEnvVar: 'SPLICEWIRE_TOKEN',
        manualFallbackHint: 'Paste a Personal Access Token directly: php artisan splicewire:connect --token=<pat>',
    },
};

const INSTALLED: InstalledExtension[] = [
    {
        installId: 10,
        productId: 2,
        name: 'Satellite',
        kind: 'beam_extension',
        trustTier: 'Official',
        isPlatformTier: true,
        installedAt: '2026-08-01T00:00:00Z',
        installedVersion: '1.0.0',
        latestVersion: '1.1.0',
        updateAvailable: true,
    },
];

function fakeClient(overrides: Partial<ExtensionsClient> = {}): ExtensionsClient {
    return {
        getCatalog: vi.fn(async () => CATALOG),
        getListing: vi.fn(async () => CATALOG.listings[0]),
        getConnectionStatus: vi.fn(async () => DISCONNECTED_STATUS),
        getInstalled: vi.fn(async () => INSTALLED),
        install: vi.fn(async () => INSTALLED[0]),
        update: vi.fn(async () => ({ ...INSTALLED[0], updateAvailable: false, installedVersion: '1.1.0' })),
        remove: vi.fn(async () => undefined),
        ...overrides,
    };
}

function mount(node: ReactNode, client: ExtensionsClient, services: Record<string, unknown> = {}) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <ExtensionsProvider services={{ client, ...services }}>{node}</ExtensionsProvider>
        </QueryClientProvider>,
    );
}

describe('ExtensionsCatalog — isolation mount (no Laravel)', () => {
    it('renders both listing kinds off a pure generated-DTO fixture, with trust + lock badges', async () => {
        const client = fakeClient();
        mount(<ExtensionsCatalog onSelect={() => {}} />, client);

        expect(await screen.findByText('Acme Waveform')).toBeTruthy();
        expect(screen.getByText('Satellite')).toBeTruthy();
        expect(screen.getAllByText('Official').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Requires Splicewire').length).toBe(2);
    });

    it('separates Satellite/Tower into their own Platform Tier Browse section', async () => {
        const client = fakeClient();
        mount(<ExtensionsCatalog onSelect={() => {}} />, client);

        expect(await screen.findByText('Platform Tier')).toBeTruthy();
    });

    it('shows the area-wide disconnected promo banner off the catalog connected fact', async () => {
        const client = fakeClient();
        mount(<ExtensionsCatalog onSelect={() => {}} />, client);

        expect(await screen.findByText(/isn.t connected to Splicewire/)).toBeTruthy();
    });

    it('does not show the disconnected banner when connected', async () => {
        const client = fakeClient({
            getConnectionStatus: vi.fn(async () => ({ ...DISCONNECTED_STATUS, connected: true })),
        });
        mount(<ExtensionsCatalog onSelect={() => {}} />, client);

        await screen.findByText('Acme Waveform');
        expect(screen.queryByText(/isn.t connected to Splicewire/)).toBeNull();
    });

    it('routes card selection to the injected onSelect callback', async () => {
        const client = fakeClient();
        const onSelect = vi.fn();
        mount(<ExtensionsCatalog onSelect={onSelect} />, client);

        fireEvent.click(await screen.findByText('Acme Waveform'));
        expect(onSelect).toHaveBeenCalledWith(1);
    });
});

describe('InstalledTab — real inline Update/Remove mutations (contract kind 1)', () => {
    it('renders the installed set off a pure fixture and shows update-available state', async () => {
        const client = fakeClient();
        mount(<InstalledTab />, client);

        expect(await screen.findByText('Satellite')).toBeTruthy();
        expect(screen.getByRole('button', { name: /update/i })).toBeTruthy();
    });

    it('routes Update through the injected client.update', async () => {
        const client = fakeClient();
        mount(<InstalledTab />, client);

        fireEvent.click(await screen.findByRole('button', { name: /update/i }));
        await waitFor(() => expect(client.update).toHaveBeenCalledWith(10));
    });

    it('routes Remove through the injected client.remove — a real mutation, not a hide flag', async () => {
        const client = fakeClient();
        mount(<InstalledTab />, client);

        fireEvent.click(await screen.findByRole('button', { name: /remove/i }));
        await waitFor(() => expect(client.remove).toHaveBeenCalledWith(10));
    });
});

describe('ExtensionsArea — top-level composition', () => {
    it('switches between Browse and Installed tabs', async () => {
        const client = fakeClient();
        mount(<ExtensionsArea />, client);

        expect(await screen.findByText('Acme Waveform')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Installed' }));
        expect(await screen.findByText('Satellite')).toBeTruthy();
    });
});
