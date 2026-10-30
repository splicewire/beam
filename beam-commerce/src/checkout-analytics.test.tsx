// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ report: vi.fn(), order: [] as string[] }));
vi.mock('@splicewire/beam-ux/site', () => ({
    reportEvent: (name: string, params: unknown) => {
        h.order.push(`report:${name}`);
        h.report(name, params);
    },
}));

import { CommerceProvider, type CommerceClient } from './commerce-provider';
import { CreditsSurface } from './CreditsSurface';
import { makeCommerceClient, RELOAD_CAPTURED, RELOAD_DECLINED } from './story-harness';
import { SubscriptionSurface } from './SubscriptionSurface';

/**
 * EP-29 follow-on (an-0237 d8; launch EP29-FOLLOWON-PLAN.md rulings 1 and 3): the packaged checkout surfaces report GA4
 * `begin_checkout` when a checkout starts (before a hosted redirect leaves the page) and `purchase` only for a direct reload the
 * rail CAPTURED, with its provider reference as the transaction id. A hosted checkout's purchase is the server's to report.
 */
function mount(ui: ReactNode, client: CommerceClient, navigate = vi.fn()) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
        <QueryClientProvider client={queryClient}>
            <CommerceProvider services={{ client, can: () => true, navigate }}>{ui}</CommerceProvider>
        </QueryClientProvider>,
    );

    return navigate;
}

const events = (name: string) => h.report.mock.calls.filter(([n]) => n === name).map(([, p]) => p);

beforeEach(() => {
    h.report.mockReset();
    h.order = [];
});
afterEach(cleanup);

describe('checkout analytics', () => {
    it('reports begin_checkout for a hosted top-up before the redirect leaves the page', async () => {
        const assign = vi.fn(() => h.order.push('redirect'));
        vi.stubGlobal('location', { ...window.location, assign });
        const client = {
            ...makeCommerceClient({ hostedCheckout: true }),
            startTopupCheckout: async () => ({ action: { kind: 'redirect', url: 'https://checkout.test/s/1' } }),
        } as unknown as CommerceClient;
        mount(<CreditsSurface />, client);

        fireEvent.click(await screen.findByRole('button', { name: /Add credits/ }));
        fireEvent.click(await screen.findByRole('button', { name: /Pay & add credits/ }));

        await waitFor(() => expect(assign).toHaveBeenCalledWith('https://checkout.test/s/1'));
        expect(events('begin_checkout')).toEqual([
            { currency: 'USD', value: 100, items: [{ item_id: 'credits', item_name: 'Credits', price: 100, quantity: 1 }] },
        ]);
        expect(h.order).toEqual(['report:begin_checkout', 'redirect']);
        expect(events('purchase')).toEqual([]);
        vi.unstubAllGlobals();
    });

    it('reports purchase for a captured direct reload, with its provider reference as the transaction id', async () => {
        mount(<CreditsSurface />, makeCommerceClient({ reloads: [RELOAD_CAPTURED] }));

        fireEvent.click(await screen.findByRole('button', { name: /Add credits/ }));
        fireEvent.click(await screen.findByRole('button', { name: /Pay & add credits/ }));

        await waitFor(() => expect(events('purchase')).toHaveLength(1));
        expect(events('purchase')[0]).toEqual({
            transaction_id: 'fake_9f21c0a3',
            currency: 'USD',
            value: 100,
            items: [{ item_id: 'credits', item_name: 'Credits', price: 100, quantity: 1 }],
        });
        expect(events('begin_checkout')).toHaveLength(1);
    });

    it('reports no purchase for a declined reload', async () => {
        mount(<CreditsSurface />, makeCommerceClient({ reloads: [RELOAD_DECLINED] }));

        fireEvent.click(await screen.findByRole('button', { name: /Add credits/ }));
        fireEvent.click(await screen.findByRole('button', { name: /Pay & add credits/ }));

        await waitFor(() => expect(events('begin_checkout')).toHaveLength(1));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(events('purchase')).toEqual([]);
    });

    it('reports begin_checkout for a plan checkout, naming the plan, before navigating to it', async () => {
        const base = makeCommerceClient();
        const client = {
            ...base,
            getSubscription: async () => ({
                ...(await base.getSubscription()),
                subscription: { id: 's1', planId: 'plan_pro', plan: { id: 'plan_pro', name: 'Pro' }, awaitingPayment: true, active: false },
                lifecycle: 'none',
            }),
            startSubscriptionCheckout: async () => ({ url: 'https://checkout.test/sub/1' }),
        } as unknown as CommerceClient;
        const navigate = mount(<SubscriptionSurface />, client, vi.fn(() => h.order.push('redirect')));

        fireEvent.click(await screen.findByRole('button', { name: /Subscribe/ }));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith('https://checkout.test/sub/1'));
        expect(events('begin_checkout')).toEqual([{ items: [{ item_id: 'plan_pro', item_name: 'Pro', quantity: 1 }] }]);
        expect(h.order).toEqual(['report:begin_checkout', 'redirect']);
    });
});
