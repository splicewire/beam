import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { AutoReloadProvider } from './provider';
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
