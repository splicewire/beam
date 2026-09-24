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
    CreditReloadResult,
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
        subscribableType: null,
        subscribableId: null,
        // Was `undefined`, with a comment blaming a missing `#[TypeScript]` on
        // `Rushing\Commerce\Enums\Cadence`. That diagnosis was wrong and the attribute was never the
        // mechanism (particle-resource-contract-regen 02): the flagship's transformer simply did not
        // SCAN `rushing/laravel-commerce`, and the stock `EnumTransformer` claims any backed enum in a
        // scanned directory, attribute or not. One scan directory at the host emits the real union.
        cadence: 'recurring',
        commitmentMonths: null,
        overrides: {},
        entitlements: {},
        budgetLimitUsd: 200,
        startedAt: '2026-01-01T00:00:00Z',
        endedAt: null,
        active: true,
        pausedAt: null,
        pausedUntil: null,
        plan: {
            id: 'p1',
            slug: 'songwriter',
            name: 'Songwriter',
            description: 'The pro plan',
            components: [],
            entitlements: {},
        },
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
        startTopupCheckout: vi.fn(async () => ({ clientSecret: 'cs_test' })),
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

    it('lets a long ledger Reason wrap instead of widening the table past the page', async () => {
        // `truncate` is nowrap, and the DataTable is auto-layout, so a long Reason grew its column to the full
        // text and pushed Amount/Balance off-screen at narrow width (G3-COMMERCE-BILLING, overnight-polish 03).
        mount(<CreditsSurface />, fakeClient());

        const reason = await screen.findByText('Generation');
        expect(reason.className).not.toContain('truncate');
        // overflow-wrap:anywhere (not break-words) also lowers the table's min-content, so a long unbroken token
        // (an id, a URL, the mono purchaseRef) cannot widen the column either (review-r1 on 5aaa2f2).
        expect(reason.className).toContain('[overflow-wrap:anywhere]');
        expect(screen.getByText('cs_test_123').className).toContain('[overflow-wrap:anywhere]');
        expect(screen.getByText('$149.00').className).toContain('whitespace-nowrap');
    });

    it('routes the top-up through the injected startTopupCheckout', async () => {
        const client = fakeClient();
        mount(<CreditsSurface />, client);

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        await waitFor(() => expect(client.startTopupCheckout).toHaveBeenCalledWith(100));
    });
});

// ── The DIRECT-RAIL reload (ux-demo-convergence G3) ─────────────────────────
//
// A host that collects on a configured money-in rail declares `reloadCredits`, and the surface takes
// the synchronous path: captured / declined + retry, settled by the time the response returns. A
// host that omits it keeps the hosted Stripe Checkout path above, unchanged — which is what the two
// `startTopupCheckout` tests already assert.

const EMPTY_WALLET: WalletBalance = {
    creditedUsd: 0,
    debitedUsd: 0,
    balanceUsd: 0,
    unit: 'usd',
    ledger: [],
};

const FUNDED_WALLET: WalletBalance = {
    creditedUsd: 100,
    debitedUsd: 0,
    balanceUsd: 100,
    unit: 'usd',
    ledger: [
        {
            id: 'c1',
            at: '2026-09-12T12:00:00Z',
            type: 'credit',
            amountUsd: 100,
            runningUsd: 100,
            reason: 'topup:fake_abc',
            purchaseRef: null,
        },
    ],
};

const CAPTURED: CreditReloadResult = {
    paymentStatus: 'succeeded',
    captured: true,
    amountUsd: 100,
    driver: 'fake',
    declineCode: null,
    providerRef: 'fake_abc',
    wallet: FUNDED_WALLET,
};

/** The fake rail's magic decline amount ($666.02) — `commerce.fake.decline_minor_units`. */
const DECLINED: CreditReloadResult = {
    paymentStatus: 'failed',
    captured: false,
    amountUsd: 666.02,
    driver: 'fake',
    declineCode: 'card_declined',
    providerRef: 'fake_def',
    wallet: EMPTY_WALLET,
};

describe('CreditsSurface — the direct-rail reload', () => {
    it('renders the empty wallet with a next step rather than a blank table', async () => {
        mount(<CreditsSurface />, fakeClient({ getWallet: vi.fn(async () => EMPTY_WALLET) }));

        expect(await screen.findByText('Prepaid balance')).toBeTruthy();
        expect(await screen.findByText(/No credit activity yet/i)).toBeTruthy();
    });

    it('shows a loading state while the wallet is in flight', async () => {
        mount(
            <CreditsSurface />,
            fakeClient({ getWallet: vi.fn(() => new Promise<WalletBalance>(() => {})) }),
        );

        expect(await screen.findByText('Loading wallet…')).toBeTruthy();
    });

    it('reports a wallet read failure instead of rendering a zero balance', async () => {
        mount(
            <CreditsSurface />,
            fakeClient({
                getWallet: vi.fn(async () => {
                    throw new Error('Wallet is unavailable.');
                }),
            }),
        );

        expect(await screen.findByText('Wallet is unavailable.')).toBeTruthy();
    });

    it('captures a reload through the injected rail and shows the funded balance', async () => {
        const client = fakeClient({
            getWallet: vi.fn(async () => EMPTY_WALLET),
            reloadCredits: vi.fn(async () => CAPTURED),
        });
        mount(<CreditsSurface />, client);

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        await waitFor(() => expect(client.reloadCredits).toHaveBeenCalledWith(100));

        expect(await screen.findByText('Credits added.')).toBeTruthy();
        expect(await screen.findByText(/captured on the/i)).toBeTruthy();
        // The wallet query was SEEDED from the result — the headline reads the new balance with no
        // second round trip, and getWallet was called exactly once (the initial read).
        expect(client.getWallet).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0));
    });

    it('shows a decline with its code, the unchanged balance, and a retry path', async () => {
        const client = fakeClient({
            getWallet: vi.fn(async () => EMPTY_WALLET),
            reloadCredits: vi.fn(async () => DECLINED),
        });
        mount(<CreditsSurface />, client);

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('Declined');
        expect(alert.textContent).toContain('card_declined');
        expect(alert.textContent).toContain('Your balance is unchanged');
        expect(await screen.findByRole('button', { name: /try again/i })).toBeTruthy();
        // A decline is NOT an error — the mutation resolved, so nothing renders the transport-failure
        // copy, and the balance is still the pre-attempt one.
        expect(screen.queryByText(/Could not reach the payment rail/i)).toBeNull();
    });

    it('retries after a decline and captures on the second attempt', async () => {
        const reloadCredits = vi
            .fn<(amountUsd: number) => Promise<CreditReloadResult>>()
            .mockResolvedValueOnce(DECLINED)
            .mockResolvedValueOnce(CAPTURED);

        mount(<CreditsSurface />, fakeClient({ getWallet: vi.fn(async () => EMPTY_WALLET), reloadCredits }));

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        fireEvent.click(await screen.findByRole('button', { name: /try again/i }));

        // Retry returns to the amount step, not to a dead end.
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        expect(await screen.findByText('Credits added.')).toBeTruthy();
        expect(reloadCredits).toHaveBeenCalledTimes(2);
    });

    it('reports a transport failure separately from a decline', async () => {
        mount(
            <CreditsSurface />,
            fakeClient({
                getWallet: vi.fn(async () => EMPTY_WALLET),
                reloadCredits: vi.fn(async () => {
                    throw new Error('Network unreachable.');
                }),
            }),
        );

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        expect(await screen.findByText('Network unreachable.')).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('keeps the hosted-checkout path for a host that declares no direct rail', async () => {
        const client = fakeClient();
        expect(client.reloadCredits).toBeUndefined();

        mount(<CreditsSurface />, client);

        fireEvent.click(await screen.findByRole('button', { name: /add credits/i }));
        fireEvent.click(await screen.findByRole('button', { name: /pay & add credits/i }));

        await waitFor(() => expect(client.startTopupCheckout).toHaveBeenCalledWith(100));
        expect(await screen.findByText(/crediting your wallet/i)).toBeTruthy();
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
        // The SERVER's permission names, verbatim (PermissionsSeeder grants Admin `usage.view` +
        // `billing.view`). This test previously granted `view-usage`/`view-billing` — the same wrong
        // pair the component asked for — so it stayed green while the sections never rendered in
        // production. Granting the real names is what couples this assertion to the server.
        mount(<BillingSurface />, client, { can: (p: string) => p === 'usage.view' || p === 'billing.view' });

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
