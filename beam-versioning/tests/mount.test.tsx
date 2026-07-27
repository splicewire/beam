import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import through the package barrel — the same entry a host consumes. If any coupling had been
// smuggled in (a `@/…` path, `sonner`, axios), resolving `../src/index` here would blow up first.
import {
    VersionsList,
    VersionsPanel,
    VersionsProvider,
    useRestoreVersion,
    useNotify,
} from '../src/index';
import type { VersionData, VersionsClient } from '../src/index';

// Radix Dialog reaches for a few browser APIs jsdom doesn't ship. Polyfill them so the mount is a
// faithful component tree, not a stubbed shell.
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

// The §8a bar: a pure record-agnostic fixture so the render can't drift from the real projected
// shape. `VersionData` is imported straight from the package's public type surface.
const FIXTURE: VersionData[] = [
    {
        id: 'a1',
        version: 2,
        readable: 'v2',
        label: 'before the rewrite',
        createdBy: 'usr_ada',
        createdAt: '2026-07-20T00:00:00+00:00',
        isHead: true,
    },
    {
        id: 'a0',
        version: 1,
        readable: 'v1',
        label: null,
        createdBy: 'usr_ada',
        createdAt: '2026-07-01T00:00:00+00:00',
        isHead: false,
    },
];

function fakeClient(versions: VersionData[]): VersionsClient {
    return {
        list: vi.fn(async () => versions),
        save: vi.fn(async () => versions[0]),
        restore: vi.fn(async () => versions[0]),
    };
}

function mount(services: Parameters<typeof VersionsProvider>[0]['services']) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <VersionsProvider services={services}>
                <VersionsPanel />
            </VersionsProvider>
        </QueryClientProvider>,
    );
}

describe('VersionsPanel — isolation mount (no Laravel)', () => {
    it('renders version rows off a record-agnostic fixture through the injected adapter', async () => {
        const client = fakeClient(FIXTURE);
        mount({ client });

        expect(await screen.findByText('v2')).toBeTruthy();
        expect(screen.getByText('v1')).toBeTruthy();
        // The list came from the injected adapter, not a hardwired transport.
        expect(client.list).toHaveBeenCalledTimes(1);
    });

    it('marks the HEAD version with a badge', async () => {
        const client = fakeClient(FIXTURE);
        mount({ client });
        // v2 is HEAD in the fixture.
        expect(await screen.findByText('HEAD')).toBeTruthy();
    });

    // Clicking Restore must GATE on a confirm — it never fires the transport directly. We assert
    // this at the VersionsList seam (an onRestore spy) rather than by opening the Radix confirm
    // dialog: mounting a Radix portal in this cross-workspace package test drags react-remove-scroll
    // from the schemastud node_modules tree, duplicating React (a test-harness artifact the app's
    // single-tree Vite dedupe avoids at runtime, not a component defect — same call beam-accounts
    // made). The full click-Restore → confirm-dialog → transport flow is proven by the RestoreFlow
    // Storybook play, which renders in a single-tree app-like environment.
    it('gates Restore behind a confirm — clicking a row calls onRestore, never the transport', async () => {
        const onRestore = vi.fn();
        const client = fakeClient(FIXTURE);
        render(
            <VersionsProvider services={{ client }}>
                <VersionsList versions={FIXTURE} onRestore={onRestore} />
            </VersionsProvider>,
        );

        fireEvent.click(await screen.findByRole('button', { name: /Restore v1/i }));
        expect(onRestore).toHaveBeenCalledWith(FIXTURE[1]);
        // The gate held: no roll-forward fired from a bare row click.
        expect(client.restore).not.toHaveBeenCalled();
    });

    it('saves a new version through the injected adapter, carrying the typed label', async () => {
        const client = fakeClient(FIXTURE);
        mount({ client });

        // Save is a two-step reveal → confirm so a label can be typed (PRD story 7).
        fireEvent.click(await screen.findByRole('button', { name: /save version/i }));
        fireEvent.change(screen.getByLabelText(/version label/i), {
            target: { value: 'before the rewrite' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
        await waitFor(() =>
            expect(client.save).toHaveBeenCalledWith({ label: 'before the rewrite' }),
        );
    });

    it('mints a bare version when no label is typed', async () => {
        const client = fakeClient(FIXTURE);
        mount({ client });
        fireEvent.click(await screen.findByRole('button', { name: /save version/i }));
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
        await waitFor(() => expect(client.save).toHaveBeenCalledWith({ label: undefined }));
    });

    it('renders the empty state when there are no versions', async () => {
        const client = fakeClient([]);
        mount({ client });
        expect(await screen.findByText(/no versions yet/i)).toBeTruthy();
    });

    it('renders the error state when the fetch rejects', async () => {
        const client: VersionsClient = {
            list: vi.fn(async () => {
                throw new Error('boom');
            }),
            save: vi.fn(),
            restore: vi.fn(),
        };
        mount({ client });
        expect(await screen.findByText(/could not load version history/i)).toBeTruthy();
    });

    it('hides Save and disables Restore for a view-only (disabled) mount', async () => {
        const client = fakeClient(FIXTURE);
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        render(
            <QueryClientProvider client={queryClient}>
                <VersionsProvider services={{ client }}>
                    <VersionsPanel disabled />
                </VersionsProvider>
            </QueryClientProvider>,
        );

        await screen.findByText('v1');
        expect(screen.queryByRole('button', { name: /save version/i })).toBeNull();
        expect(
            screen.getByRole('button', { name: /Restore v1/i }).hasAttribute('disabled'),
        ).toBe(true);
    });

    it('delivers feedback through the injected notify sink (contract §3)', async () => {
        const notify = vi.fn();
        const client = fakeClient(FIXTURE);
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        render(
            <QueryClientProvider client={queryClient}>
                <VersionsProvider services={{ client, notify }}>
                    <VersionsPanel />
                </VersionsProvider>
            </QueryClientProvider>,
        );

        fireEvent.click(await screen.findByRole('button', { name: /save version/i }));
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
        await waitFor(() =>
            expect(notify).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            ),
        );
    });

    it('routes a restore mutation through the package hook (contract §1)', async () => {
        const client = fakeClient(FIXTURE);

        function Harness() {
            const restore = useRestoreVersion();
            return (
                <button type="button" onClick={() => restore.mutate({ ref: 'v9' })}>
                    restore
                </button>
            );
        }

        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        render(
            <QueryClientProvider client={queryClient}>
                <VersionsProvider services={{ client }}>
                    <Harness />
                </VersionsProvider>
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'restore' }));
        await waitFor(() => expect(client.restore).toHaveBeenCalledWith('v9', {}));
    });

    it('falls back to a dependency-free notify when the host injects none (bare mount works)', async () => {
        const client = fakeClient(FIXTURE);
        function Harness() {
            const emit = useNotify();
            return (
                <button type="button" onClick={() => emit({ type: 'success', message: 'ok' })}>
                    notify
                </button>
            );
        }
        render(
            <VersionsProvider services={{ client }}>
                <Harness />
            </VersionsProvider>,
        );
        // No throw = the console default applied.
        fireEvent.click(screen.getByRole('button', { name: 'notify' }));
        expect(screen.getByRole('button', { name: 'notify' })).toBeTruthy();
    });
});
