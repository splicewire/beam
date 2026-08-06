import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
// Import through the package barrel — the same entry a host consumes. If any coupling had been
// smuggled in (a `@/…` path, axios, react-router), resolving `../src/index` here would blow up first.
import {
    BillingSurface,
    CommerceProvider,
    CreditsSurface,
    SubscriptionSurface,
} from '../src/index';
import type {
    Bill,
    BillPreview,
    BudgetVerdict,
    CommerceClient,
    EntitlementRecord,
    SubscriptionView,
    UsageSummary,
    WalletBalance,
} from '../src/index';

// Radix (Sheet/Dialog) reaches for a few browser APIs jsdom doesn't ship. Polyfill them so the mount
// is a faithful component tree, not a stubbed shell.
beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.scrollIntoView ??= () => {};
});

// ── Pure generated-DTO fixtures — the render can't drift from the real projected shape. ──
const WALLET: WalletBalance = {
    creditedUsd: 200,
    debitedUsd: 45.5,
    balanceUsd: 154.5,
    unit: 'usd',
    ledger: [
        {
            id: 'e1',
            at: '2026-08-01T12:00:00Z',
            type: 'credit',
            amountUsd: 100,
            runningUsd: 154.5,
            reason: 'Top-up',
            purchaseRef: 'cs_test_123',
        },
        {
            id: 'e2',
            at: '2026-08-02T12:00:00Z',
            type: 'debit',
            amountUsd: 5.5,
            runningUsd: 149,
            reason: 'Generation',
            purchaseRef: null,
        },
    ],
};

const BUDGET: BudgetVerdict = {
    allowed: true,
    uncapped: false,
    warning: false,
    spentUsd: 40,
    capUsd: 200,
    remainingUsd: 160,
    fractionUsed: 0.2,
    offer: null,
    bindingSourceId: 'plan-1',
    stopKind: null,
    autoReloadPending: false,
};

const USAGE: UsageSummary = {
    month: '2026-08',
    totalCostUsd: 12.34,
    totalTokens: 45678,
    models: [
        { model: 'gpt-4o', promptTokens: 100, completionTokens: 200, totalTokens: 300, costUsd: 1.23 },
    ],
    autoReloadSpendUsd: 0,
    autoReloadReloadCount: 0,
};

const BILLS: Bill[] = [
    {
        id: 'b1',
        tenantId: 't1',
        billingPeriod: '2026-07',
        status: 'finalized',
        lineItems: [
            { componentType: 'generation', description: 'Song renders', amountUsd: 30, metadata: {} },
        ],
        totalUsd: 30,
        finalizedAt: '2026-08-01T00:00:00Z',
        stripeInvoiceId: 'in_1',
    },
];

const BILL_PREVIEW: BillPreview = {
    line_items: [{ component_type: 'generation', description: 'Song renders', amount_usd: 12, metadata: {} }],
    total_usd: 12,
};

const SUBSCRIPTION: SubscriptionView = {
    subscription: {
        id: 's1',
        tenantId: 't1',
        planId: 'p1',
        planSlug: 'songwriter',
        commitmentMonths: null,
        overrides: {},
        entitlements: {},
        budgetLimitUsd: 200,
        startedAt: '2026-01-01T00:00:00Z',
        endedAt: null,
        active: true,
        plan: { id: 'p1', slug: 'songwriter', name: 'Songwriter', description: 'The pro plan', components: [] },
        earliestBillablePeriod: '2026-01',
        latestBillablePeriod: '2026-08',
    },
    hasStripeId: true,
    stripePriceId: 'price_1',
    capabilityLabels: { 'generate.song': 'Generate songs' },
};

const ENTITLEMENTS: EntitlementRecord[] = [
    { capability: 'generate.song', enabled: true, source: 'plan' },
    { capability: 'export.stems', enabled: false, source: 'default' },
];

function fakeClient(overrides: Partial<CommerceClient> = {}): CommerceClient {
    return {
        getWallet: vi.fn(async () => WALLET),
        startTopupCheckout: vi.fn(async () => ({ client_secret: 'cs_test' })),
        getBudget: vi.fn(async () => BUDGET),
        getUsageSummary: vi.fn(async () => USAGE),
        getBills: vi.fn(async () => BILLS),
        getBillPreview: vi.fn(async () => BILL_PREVIEW),
        getSubscription: vi.fn(async () => SUBSCRIPTION),
        getEntitlements: vi.fn(async () => ENTITLEMENTS),
        startSubscriptionCheckout: vi.fn(async () => ({ url: 'https://stripe.test/checkout' })),
        getSubscriptionPortal: vi.fn(async () => ({ url: 'https://stripe.test/portal' })),
        ...overrides,
    };
}

function mount(node: ReactNode, client: CommerceClient, services = {}) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <CommerceProvider services={{ client, ...services }}>{node}</CommerceProvider>
        </QueryClientProvider>,
    );
}

describe('CreditsSurface — isolation mount (no Laravel)', () => {
    it('renders the wallet balance + ledger off the injected client (contract kind 1)', async () => {
        const client = fakeClient();
        mount(<CreditsSurface />, client);

        expect(await screen.findByText('Prepaid balance')).toBeTruthy();
        // $154.50 appears twice — the headline + the "= Balance" derivation row.
        expect((await screen.findAllByText('$154.50')).length).toBeGreaterThan(0);
        expect(await screen.findByText('Credit ledger')).toBeTruthy();
        expect(client.getWallet).toHaveBeenCalled();
    });

    it('routes the top-up through the injected startTopupCheckout', async () => {
        const client = fakeClient();
        mount(<CreditsSurface />, client);

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        await waitFor(() => expect(client.startTopupCheckout).toHaveBeenCalledWith(100));
    });
});

describe('BillingSurface — isolation mount', () => {
    it('renders the budget meter off a pure fixture', async () => {
        const client = fakeClient();
        mount(<BillingSurface />, client);

        expect(await screen.findByText('Spending cap')).toBeTruthy();
        expect(await screen.findByText('$40.00 of $200.00 used')).toBeTruthy();
    });

    it('progressively discloses sections through the injected can() gate (contract kind 3)', async () => {
        const client = fakeClient();
        // can() denies both — only the always-on budget meter renders; no usage/bills.
        mount(<BillingSurface />, client, { can: () => false });

        await screen.findByText('Spending cap');
        expect(screen.queryByText('Usage summary')).toBeNull();
        expect(screen.queryByText('Bills')).toBeNull();
        expect(client.getUsageSummary).not.toHaveBeenCalled();
    });

    it('renders usage + bills when can() grants the permissions', async () => {
        const client = fakeClient();
        mount(<BillingSurface />, client, { can: (p: string) => p === 'view-usage' || p === 'view-billing' });

        expect(await screen.findByText('Usage summary')).toBeTruthy();
        expect(await screen.findByText('Next bill (estimate)')).toBeTruthy();
        expect(await screen.findByText('Bills')).toBeTruthy();
    });
});

describe('SubscriptionSurface — isolation mount', () => {
    it('renders the resolved plan header + entitlement grid off injected reads', async () => {
        const client = fakeClient();
        mount(<SubscriptionSurface />, client);

        expect(await screen.findByText('Songwriter')).toBeTruthy();
        expect(await screen.findByText('Resolved entitlements')).toBeTruthy();
        expect(await screen.findByText('Generate songs')).toBeTruthy();
    });

    it('routes Manage subscription through the injected portal + navigate slot (kind 3)', async () => {
        const client = fakeClient();
        const navigate = vi.fn();
        mount(<SubscriptionSurface />, client, { navigate });

        fireEvent.click(await screen.findByRole('button', { name: /manage subscription/i }));

        await waitFor(() => expect(client.getSubscriptionPortal).toHaveBeenCalled());
        await waitFor(() => expect(navigate).toHaveBeenCalledWith('https://stripe.test/portal'));
    });

    it('surfaces the cancelled checkout signal the host passes down (router-blind)', async () => {
        const client = fakeClient();
        mount(<SubscriptionSurface checkoutSignal="cancelled" />, client);

        expect(await screen.findByText(/Checkout was cancelled/i)).toBeTruthy();
    });
});
