import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { CommerceProvider, type CommerceClient, type CommerceServices } from './commerce-provider';
import { AutoReloadProvider } from './provider';
import type { CreditReloadResult, WalletBalance } from './commerce-types';
import type {
    AutoReloadActivity,
    AutoReloadClient,
    AutoReloadConfig,
    AutoReloadServices,
} from './types';

// Fixtures ported from the auto-reload-billing prototype's `_fixtures/auto-reload.ts`, retyped
// to the generated `AutoReloadConfig`/`AutoReloadActivity` read-models (the prototype's local
// mirror graduates to the projection). USD in major units.

/** The engine safety clamps — `commerce.autoreload.policy`. Shared by every config fixture. */
const CLAMPS = {
    minCooldownSeconds: 60,
    maxReloadsCeiling: 30,
    maxSpendCeilingUsd: 500,
    maxPerReloadCeilingUsd: 200,
    effectiveCooldownSeconds: 300,
    effectiveMaxReloadsPerPeriod: 8,
    effectiveMaxSpendPerPeriodUsd: 400,
    effectiveMaxPerReloadUsd: 100,
} as const;

const BASE_CONFIG: AutoReloadConfig = {
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
    clamps: { ...CLAMPS },
};

/** Healthy, firing normally — a saved card on file. */
export const ACTIVE_CONFIG: AutoReloadConfig = { ...BASE_CONFIG };

/** Card declined N× in a row → auto-disabled by policy (repeated_failure). enabled intent kept. */
export const SUSPENDED_CONFIG: AutoReloadConfig = {
    ...BASE_CONFIG,
    status: 'suspended',
    disabledReason: 'repeated_failure',
    consecutiveFailures: 3,
};

/** Strong-customer-authentication required → terminal on first. Needs re-authorize card. */
export const SCA_CONFIG: AutoReloadConfig = {
    ...BASE_CONFIG,
    status: 'suspended',
    disabledReason: 'sca_required',
    consecutiveFailures: 1,
};

/** The card that sourced the PM vanished (plan cancelled). enabled true; degrade — card gone. */
export const NEEDS_CARD_CONFIG: AutoReloadConfig = {
    ...BASE_CONFIG,
    status: 'needs_payment_method',
    hasPaymentMethod: false,
    paymentMethodSource: 'subscription',
    disabledReason: 'payment_method_unavailable',
};

/** Never turned on. */
export const OFF_CONFIG: AutoReloadConfig = {
    ...BASE_CONFIG,
    enabled: false,
    status: 'off',
};

/** to_target mode — tops up to a target rather than a fixed amount. */
export const TO_TARGET_CONFIG: AutoReloadConfig = {
    ...BASE_CONFIG,
    amountMode: 'to_target',
    reloadAmountUsd: null,
    targetUsd: 100,
};

/** Over-policy raw values → the "Clamped to $X" hint fires against the effective ceiling. */
export const OVER_POLICY_CONFIG: AutoReloadConfig = {
    ...BASE_CONFIG,
    maxPerReloadUsd: 999,
    maxSpendPerPeriodUsd: 9999,
    maxReloadsPerPeriod: 99,
    cooldownSeconds: 30,
    clamps: {
        ...CLAMPS,
        effectiveMaxPerReloadUsd: 200,
        effectiveMaxSpendPerPeriodUsd: 500,
        effectiveMaxReloadsPerPeriod: 30,
        effectiveCooldownSeconds: 60,
    },
};

export const ACTIVITY_POPULATED: AutoReloadActivity = {
    lastReloadAt: '2026-07-26T14:12:00Z',
    lastReloadAmountUsd: 50,
    attempts: [
        { createdAt: '2026-07-26T14:12:00Z', outcome: 'succeeded', amountUsd: 50, stripeErrorCode: null },
        { createdAt: '2026-07-19T09:41:00Z', outcome: 'declined', amountUsd: 50, stripeErrorCode: 'card_declined' },
        { createdAt: '2026-07-12T22:03:00Z', outcome: 'succeeded', amountUsd: 50, stripeErrorCode: null },
    ],
};

export const ACTIVITY_EMPTY: AutoReloadActivity = {
    lastReloadAt: null,
    lastReloadAmountUsd: null,
    attempts: [],
};

export const ACTIVITY_ALL_FAILED: AutoReloadActivity = {
    lastReloadAt: null,
    lastReloadAmountUsd: null,
    attempts: [
        { createdAt: '2026-07-26T14:12:00Z', outcome: 'declined', amountUsd: 50, stripeErrorCode: 'card_declined' },
        { createdAt: '2026-07-25T14:12:00Z', outcome: 'sca_required', amountUsd: 50, stripeErrorCode: 'authentication_required' },
        { createdAt: '2026-07-24T14:12:00Z', outcome: 'transient_error', amountUsd: null, stripeErrorCode: 'transient_error' },
    ],
};

export interface AutoReloadMockConfig {
    /** The config `getConfig()` resolves with. Defaults to the active config. */
    config?: AutoReloadConfig;
    /** The activity `getActivity()` resolves with. Defaults to populated. */
    activity?: AutoReloadActivity;
}

/**
 * A fake {@link AutoReloadClient} over the fixtures — the story/test transport. `updateConfig`
 * echoes the config back with the write-shape fields applied, so a Save round-trips visibly.
 */
export function makeAutoReloadClient(mock: AutoReloadMockConfig = {}): AutoReloadClient {
    const config = mock.config ?? ACTIVE_CONFIG;
    const activity = mock.activity ?? ACTIVITY_POPULATED;
    return {
        getConfig: async () => config,
        getActivity: async () => activity,
        // The server clamps/normalizes the write-shape and returns a full read-model; the mock
        // mirrors that — coercing the write-shape's nullable `periodDays` back to the config's.
        updateConfig: async (body) => ({ ...config, ...body, periodDays: body.periodDays ?? config.periodDays }),
    };
}

/** Wrap children in a fresh QueryClient + a mocked AutoReloadProvider. */
export function MockAutoReloadProvider({
    children,
    config,
    services,
}: {
    children: ReactNode;
    config?: AutoReloadMockConfig;
    services?: Partial<Omit<AutoReloadServices, 'client'>>;
}) {
    const key = JSON.stringify(config ?? {});
    const client = useMemo(() => makeAutoReloadClient(config), [key]);
    const queryClient = useMemo(
        () => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }),
        [key],
    );
    return (
        <QueryClientProvider client={queryClient}>
            <AutoReloadProvider services={{ client, ...services }}>{children}</AutoReloadProvider>
        </QueryClientProvider>
    );
}

// ── Credits / wallet fixtures (ux-demo-convergence G3) ──────────────────────
//
// Shaped as the STANDALONE host's wallet: a credit-only ledger with the running balance walked back
// from the current one, and a `debitedUsd` of zero because a host that meters nothing has no debit
// ledger. That is the honest shape `SiteWallet::balance()` returns, not a trimmed one.

/** Nothing bought yet — the state a fresh commerce host opens on. */
export const WALLET_EMPTY: WalletBalance = {
    creditedUsd: 0,
    debitedUsd: 0,
    balanceUsd: 0,
    unit: 'usd',
    ledger: [],
};

/** One captured reload behind it. */
export const WALLET_FUNDED: WalletBalance = {
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
            reason: 'topup:fake_9f21c0a3',
            purchaseRef: null,
        },
    ],
};

export const RELOAD_CAPTURED: CreditReloadResult = {
    paymentStatus: 'succeeded',
    captured: true,
    amountUsd: 100,
    driver: 'fake',
    declineCode: null,
    providerRef: 'fake_9f21c0a3',
    wallet: WALLET_FUNDED,
};

/**
 * The fake rail's MAGIC DECLINE AMOUNT — an Order totalling exactly
 * `commerce.fake.decline_minor_units` (66602 ⇒ $666.02) comes back Failed with
 * `commerce.fake.decline_code`. The wallet rides along unchanged, which is the whole point.
 */
export const RELOAD_DECLINED: CreditReloadResult = {
    paymentStatus: 'failed',
    captured: false,
    amountUsd: 666.02,
    driver: 'fake',
    declineCode: 'card_declined',
    providerRef: 'fake_5b0e77d2',
    wallet: WALLET_EMPTY,
};

export interface CommerceMockConfig {
    /** The wallet `getWallet()` resolves with. Defaults to the funded fixture. */
    wallet?: WalletBalance;
    /** `getWallet()` never settles — the loading state. */
    walletPending?: boolean;
    /** `getWallet()` rejects with this message — the read-failure state. */
    walletError?: string;
    /** Successive `reloadCredits()` outcomes, consumed in order; the last one repeats. */
    reloads?: CreditReloadResult[];
    /** Omit the direct rail entirely — the hosted Stripe Checkout custody model. */
    hostedCheckout?: boolean;
}

/**
 * A fake {@link CommerceClient} over the fixtures. Only the credits half is exercised by the credits
 * stories; the remaining methods answer inert shapes so the ONE adapter contract stays whole (a
 * partial client would type-check by cast and then explode in a story that grew).
 */
export function makeCommerceClient(mock: CommerceMockConfig = {}): CommerceClient {
    const wallet = mock.wallet ?? WALLET_FUNDED;
    const reloads = [...(mock.reloads ?? [RELOAD_CAPTURED])];

    const client: CommerceClient = {
        getWallet: async () => {
            if (mock.walletPending) return new Promise<WalletBalance>(() => {});
            if (mock.walletError) throw new Error(mock.walletError);

            return wallet;
        },
        startTopupCheckout: async () => ({ clientSecret: 'cs_test_story' }),
        getBudget: async () => ({
            allowed: true,
            reason: null,
            stop: null,
            source: null,
            limitUsd: null,
            spentUsd: 0,
            remainingUsd: null,
            fraction: 0,
            offer: null,
        }) as unknown as Awaited<ReturnType<CommerceClient['getBudget']>>,
        getUsageSummary: async () =>
            ({}) as unknown as Awaited<ReturnType<CommerceClient['getUsageSummary']>>,
        getBills: async () => [],
        getBillPreview: async () => null,
        getSubscription: async () => ({
            subscription: null,
            hasStripeId: false,
            stripePriceId: null,
            capabilityLabels: {},
        }),
        getEntitlements: async () => [],
        startSubscriptionCheckout: async () => ({ url: '#' }),
        getSubscriptionPortal: async () => ({ url: '#' }),
    };

    if (mock.hostedCheckout) return client;

    return {
        ...client,
        reloadCredits: async () => (reloads.length > 1 ? reloads.shift()! : reloads[0]),
    };
}

/** Wrap children in a fresh QueryClient + a mocked CommerceProvider. */
export function MockCommerceProvider({
    children,
    mock,
    services,
}: {
    children: ReactNode;
    mock?: CommerceMockConfig;
    services?: Partial<Omit<CommerceServices, 'client'>>;
}) {
    const key = JSON.stringify(mock ?? {});
    const client = useMemo(() => makeCommerceClient(mock), [key]);
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            }),
        [key],
    );

    return (
        <QueryClientProvider client={queryClient}>
            <CommerceProvider services={{ client, ...services }}>{children}</CommerceProvider>
        </QueryClientProvider>
    );
}
