import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
// Import through the package barrel — the same entry a host consumes. If any coupling had been
// smuggled in (a `@/…` path, `sonner`, axios), resolving `../src/index` here would blow up first.
import { TokensPage, TokensProvider, useArchiveToken, useNotify } from '../src/index';
import type { ApiTokenData, TokensClient } from '../src/index';

// Radix Dialog/Popover reach for a few browser APIs jsdom doesn't ship. Polyfill them so the
// mount is a faithful component tree, not a stubbed shell.
beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.releasePointerCapture ??= () => {};
    Element.prototype.scrollIntoView ??= () => {};
});

// The §8a bar: a pure generated-DTO fixture so the render can't drift from the real projected
// shape. `ApiTokenData` is imported straight from the package's public type surface.
// UUID string ids: the key shape every operated host runs, and the one a `1`/`2` fixture could
// never have caught (the 2026-09-12 defect collapsed every roster row onto the same id).
const FIXTURE: ApiTokenData[] = [
    {
        id: 'e3b0c442-98fc-4c14-9afb-f4c8996fb001',
        name: 'ci-deploy',
        provenance: 'api',
        abilities: null,
        created_at: '2026-01-01T00:00:00+00:00',
        last_used_at: '2026-07-01T00:00:00+00:00',
        expires_at: null,
        archived_at: null,
        is_current: false,
    },
    {
        id: 'e3b0c442-98fc-4c14-9afb-f4c8996fb002',
        name: 'browser-mac',
        provenance: 'session',
        abilities: null,
        created_at: '2026-06-01T00:00:00+00:00',
        last_used_at: '2026-07-20T00:00:00+00:00',
        expires_at: null,
        archived_at: null,
        is_current: false,
    },
];

function fakeClient(tokens: ApiTokenData[]): TokensClient {
    return {
        list: vi.fn(async () => tokens),
        create: vi.fn(),
        renew: vi.fn(),
        rotate: vi.fn(),
        archive: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
        revokeOtherSessions: vi.fn(async () => ({
            revoked: 1,
            message: 'Signed out 1 other session.',
        })),
        listPermissions: vi.fn(async () => ['view-activity', 'manage-billing']),
    };
}

function mount(services: Parameters<typeof TokensProvider>[0]['services']): { wrapper: ReactNode } {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <TokensProvider services={services}>
                <TokensPage />
            </TokensProvider>
        </QueryClientProvider>,
    );
    return { wrapper: null };
}

describe('TokensPage — isolation mount (no Laravel)', () => {
    it('renders rows off a pure generated-DTO fixture through the injected adapter', async () => {
        const client = fakeClient(FIXTURE);
        mount({ client });

        // The api token renders (default facet filter is `api`)...
        expect(await screen.findByText('ci-deploy')).toBeTruthy();
        // ...and the list came from the injected adapter, not a hardwired transport.
        expect(client.list).toHaveBeenCalledTimes(1);
    });

    // The adapter-mutation + notify wiring is proven through the package's own public hooks
    // rather than by driving a Radix Dialog open: opening a Radix portal in this cross-workspace
    // package test drags react-remove-scroll from the schemastud node_modules tree, duplicating
    // React (a test-harness artifact the app's single-tree Vite dedupe avoids at runtime, not a
    // defect in the component). Rendering the full TokensPage above already proves it mounts off
    // the DTO fixture with no Laravel; these prove the seams carry data the right way.
    it('routes a mutation through the injected adapter (contract §1)', async () => {
        const client = fakeClient(FIXTURE);

        function Harness() {
            const archive = useArchiveToken();
            return (
                <button type="button" onClick={() => archive.mutate('e3b0c442-98fc-4c14-9afb-f4c8996fb007')}>
                    archive
                </button>
            );
        }

        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <TokensProvider services={{ client }}>
                    <Harness />
                </TokensProvider>
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'archive' }));
        await waitFor(() => expect(client.archive).toHaveBeenCalledWith('e3b0c442-98fc-4c14-9afb-f4c8996fb007'));
    });

    it('delivers feedback through the injected notify sink (contract §3)', () => {
        const notify = vi.fn();
        const client = fakeClient(FIXTURE);

        function Harness() {
            const emit = useNotify();
            return (
                <button type="button" onClick={() => emit({ type: 'success', message: 'done' })}>
                    notify
                </button>
            );
        }

        render(
            <TokensProvider services={{ client, notify }}>
                <Harness />
            </TokensProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'notify' }));
        expect(notify).toHaveBeenCalledWith({ type: 'success', message: 'done' });
    });

    it('falls back to a dependency-free notify when the host injects none (bare mount works)', async () => {
        const client = fakeClient(FIXTURE);
        // No `notify` — the console default applies; the mount must still function.
        mount({ client });
        expect(await screen.findByText('ci-deploy')).toBeTruthy();
    });

    it('renders the injected host chrome slot per row', async () => {
        const client = fakeClient(FIXTURE);
        mount({
            client,
            renderTokenActivity: (token) => <span data-testid="activity">act:{token.id}</span>,
        });

        // The api row carries the host-injected activity affordance, keyed on the row's real id.
        expect(await screen.findByText(`act:${FIXTURE[0].id}`)).toBeTruthy();
    });
});
