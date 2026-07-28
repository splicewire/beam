// The generated DTO projection (rehome-ui / ADR-0116): the PHP `#[TypeScript]` auto-reload
// types, sliced off the app's single `generated.d.ts` and delivered as a bundle. This
// build-time dependency is LOAD-BEARING — the component's default typing IS the projection,
// so the PHP source of truth genuinely travels into this package. tsup inlines these into the
// shipped `dist/index.d.ts`, so a consumer resolves them transitively via the package dep.
import type {
    AutoReloadActivityData,
    AutoReloadAttemptData,
    AutoReloadClampsData,
    AutoReloadConfigData,
} from '@splicewire/_resources/types/auto-reload';

export type {
    AutoReloadActivityData,
    AutoReloadAttemptData,
    AutoReloadClampsData,
    AutoReloadConfigData,
};

// ── Display-hint unions ─────────────────────────────────────────────────────
// The DTOs ship these fields as bare `string`; the package narrows them to the one
// vocabulary the surface renders (the trailing `string` keeps an unknown future value
// assignable). These are TS-only — NOT PHP `#[TypeScript]` types — so they live here, not in
// the projected `_resources` slice.

/** The derived lifecycle status the status pill + failure banner switch on. */
export type AutoReloadStatus = 'off' | 'active' | 'suspended' | 'needs_payment_method' | string;

/** The reload-amount mode — the segmented control's two options. */
export type AmountMode = 'fixed' | 'to_target' | string;

/** The saved-card source. */
export type PaymentMethodSource = 'setup_intent' | 'subscription' | string;

/** The attempt-ledger outcome vocabulary the activity badges render. */
export type AttemptOutcome =
    | 'succeeded'
    | 'declined'
    | 'sca_required'
    | 'transient_error'
    | 'blocked'
    | string;

// ── Read-models (DTO + narrowed display-hint unions) ────────────────────────
// Alias the generated DTOs, re-declaring only the display-hint fields; each stays
// structurally `string`, so wire-compatible. Every other field — including the nested
// `clamps` — stays contract-backed by the projection.

export type AutoReloadClamps = AutoReloadClampsData;

export type AutoReloadConfig = Omit<
    AutoReloadConfigData,
    'status' | 'amountMode' | 'paymentMethodSource'
> & {
    status: AutoReloadStatus;
    amountMode: AmountMode;
    paymentMethodSource: PaymentMethodSource | null;
};

export type AutoReloadAttempt = Omit<AutoReloadAttemptData, 'outcome'> & {
    outcome: AttemptOutcome;
};

export type AutoReloadActivity = Omit<AutoReloadActivityData, 'attempts'> & {
    attempts: AutoReloadAttempt[];
};

/** The PUT request body (client-only — a write shape, not a read-model). */
export interface AutoReloadConfigUpdate {
    enabled: boolean;
    thresholdUsd: number;
    amountMode: 'fixed' | 'to_target';
    reloadAmountUsd?: number | null;
    targetUsd?: number | null;
    cooldownSeconds?: number | null;
    maxReloadsPerPeriod?: number | null;
    maxSpendPerPeriodUsd?: number | null;
    maxPerReloadUsd?: number | null;
    periodDays?: number | null;
    paymentMethodSource?: 'setup_intent' | 'subscription' | null;
}

// ── The four-kind injection contract ────────────────────────────────────────

/**
 * The injected transport adapter — the ONE thing a host must implement (kind 1). It wraps
 * whatever transport the host already has (axios, fetch, a server action) and points it at
 * the correct tenant + the literal `studio/credits/auto-reload*` endpoints; the component is
 * tenant- and URL-blind.
 */
export interface AutoReloadClient {
    getConfig(): Promise<AutoReloadConfig>;
    updateConfig(body: AutoReloadConfigUpdate): Promise<AutoReloadConfig>;
    getActivity(): Promise<AutoReloadActivity>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider. Only `client` is required
 * (kind 1); the rest have dependency-free defaults.
 */
export interface AutoReloadServices {
    /** kind 1 — the transport adapter (required). */
    client: AutoReloadClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: NotifyEvent) => void;
    /** kind 2 — mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * kind 3 — the Stripe SetupIntent host slot. Enabling auto-reload without a saved card must
     * eventually open a SetupIntent (usage=off_session) to collect + save a card. That flow is
     * Stripe.js + host-tenant specific, so the package MUST NOT own it: the "Save / Update card"
     * affordances invoke this. Omitted → a no-op (the honest home for the surface's original
     * `TODO(stripe-setup-intent)` placeholder). There is deliberately NO subscribe kind.
     */
    onSavePaymentMethod?: () => void;
}
