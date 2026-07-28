import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
// Import through the package barrel — the same entry a host consumes. If any coupling had been
// smuggled in (a `@/…` path, `sonner`, axios), resolving `../src/index` here would blow up first.
import {
    AutoReloadConfigCard,
    AutoReloadProvider,
    ReloadActivityCard,
    useSavePaymentMethod,
} from '../src/index';
import type {
    AutoReloadActivity,
    AutoReloadClient,
    AutoReloadConfig,
} from '../src/index';

// Radix/Switch reach for a few browser APIs jsdom doesn't ship. Polyfill them so the mount is a
// faithful component tree, not a stubbed shell.
beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.scrollIntoView ??= () => {};
});

// The §8a bar: a pure generated-DTO fixture so the render can't drift from the real projected
// shape. `AutoReloadConfig` is imported straight from the package's public type surface.
const CONFIG: AutoReloadConfig = {
    enabled: true,
    status: 'active',
    thresholdUsd: 10,
    amountMode: 'fixed',
    reloadAmountUsd: 50,
    targetUsd: null,
    cooldownSeconds: 300,
    maxReloadsPerPeriod: 8,
    maxSpendPerPeriodUsd: 400,
    maxPerReloadUsd: 100,
    periodDays: 30,
    hasPaymentMethod: true,
    paymentMethodSource: 'setup_intent',
    disabledReason: null,
    consecutiveFailures: 0,
    clamps: {
        minCooldownSeconds: 60,
        maxReloadsCeiling: 30,
        maxSpendCeilingUsd: 500,
        maxPerReloadCeilingUsd: 200,
        effectiveCooldownSeconds: 300,
        effectiveMaxReloadsPerPeriod: 8,
        effectiveMaxSpendPerPeriodUsd: 400,
        effectiveMaxPerReloadUsd: 100,
    },
};

const ACTIVITY: AutoReloadActivity = {
    lastReloadAt: '2026-07-26T14:12:00Z',
    lastReloadAmountUsd: 50,
    attempts: [
        { createdAt: '2026-07-26T14:12:00Z', outcome: 'succeeded', amountUsd: 50, stripeErrorCode: null },
    ],
};

function fakeClient(config: AutoReloadConfig): AutoReloadClient {
    return {
        getConfig: vi.fn(async () => config),
        getActivity: vi.fn(async () => ACTIVITY),
        updateConfig: vi.fn(async (body) => ({ ...config, ...body, periodDays: body.periodDays ?? config.periodDays })),
    };
}

function mount(node: ReactNode, client: AutoReloadClient, services = {}) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <AutoReloadProvider services={{ client, ...services }}>{node}</AutoReloadProvider>
        </QueryClientProvider>,
    );
}

describe('AutoReloadConfigCard — isolation mount (no Laravel)', () => {
    it('renders the config off a pure generated-DTO fixture', async () => {
        const client = fakeClient(CONFIG);
        mount(<AutoReloadConfigCard config={CONFIG} />, client);

        expect(await screen.findByText('Automatic reload')).toBeTruthy();
        expect(screen.getByText('Active')).toBeTruthy();
    });

    it('routes Save through the injected client.updateConfig (contract kind 1)', async () => {
        const client = fakeClient(CONFIG);
        mount(<AutoReloadConfigCard config={CONFIG} />, client);

        fireEvent.click(await screen.findByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(client.updateConfig).toHaveBeenCalledTimes(1));
        expect(client.updateConfig).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: true, amountMode: 'fixed', thresholdUsd: 10 }),
        );
    });

    it('invokes the injected onSavePaymentMethod host slot (contract kind 3)', async () => {
        const client = fakeClient({ ...CONFIG, hasPaymentMethod: false, status: 'needs_payment_method' });
        const onSavePaymentMethod = vi.fn();
        mount(
            <AutoReloadConfigCard
                config={{ ...CONFIG, hasPaymentMethod: false, status: 'needs_payment_method' }}
            />,
            client,
            { onSavePaymentMethod },
        );

        fireEvent.click((await screen.findAllByRole('button', { name: /save a card/i }))[0]);
        expect(onSavePaymentMethod).toHaveBeenCalled();
    });

    it('defaults the Stripe host slot to a no-op when the host injects none', () => {
        const client = fakeClient(CONFIG);
        function Harness() {
            const save = useSavePaymentMethod();
            return <button type="button" onClick={save}>save</button>;
        }
        mount(<Harness />, client);
        // No throw when clicked without an injected handler.
        fireEvent.click(screen.getByRole('button', { name: 'save' }));
    });
});

describe('ReloadActivityCard — isolation mount', () => {
    it('renders the attempt ledger off a pure fixture', async () => {
        const client = fakeClient(CONFIG);
        mount(<ReloadActivityCard activity={ACTIVITY} />, client);

        expect(await screen.findByText('Reload activity')).toBeTruthy();
        expect(screen.getByText('Reloaded')).toBeTruthy();
    });
});
