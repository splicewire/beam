import * as react from 'react';
import { ReactNode } from 'react';
import { AutoReloadActivityData, AutoReloadAttemptData, AutoReloadClampsData, AutoReloadConfigData } from '@splicewire/beam-resources/types/auto-reload';
export { AutoReloadActivityData, AutoReloadAttemptData, AutoReloadClampsData, AutoReloadConfigData } from '@splicewire/beam-resources/types/auto-reload';
import * as _tanstack_react_query from '@tanstack/react-query';
import * as _splicewire_beam_resources_types_commerce from '@splicewire/beam-resources/types/commerce';
import { BillData, BillLineItemData, BudgetOfferData, BudgetVerdictData, WalletBalanceData, UsageSummaryData, SubscriptionData, EntitlementData, CreditEntryData, PlanData, UpsellOfferData, UsageModelBreakdownData } from '@splicewire/beam-resources/types/commerce';
export { BillData, BillLineItemData, BudgetOfferData, BudgetVerdictData, CreditEntryData, EntitlementData, PlanData, SubscriptionData, UpsellOfferData, UsageModelBreakdownData, UsageSummaryData, WalletBalanceData } from '@splicewire/beam-resources/types/commerce';

/** The derived lifecycle status the status pill + failure banner switch on. */
type AutoReloadStatus = 'off' | 'active' | 'suspended' | 'needs_payment_method' | string;
/** The reload-amount mode — the segmented control's two options. */
type AmountMode = 'fixed' | 'to_target' | string;
/** The saved-card source. */
type PaymentMethodSource = 'setup_intent' | 'subscription' | string;
/** The attempt-ledger outcome vocabulary the activity badges render. */
type AttemptOutcome = 'succeeded' | 'declined' | 'sca_required' | 'transient_error' | 'blocked' | string;
type AutoReloadClamps = AutoReloadClampsData;
type AutoReloadConfig = Omit<AutoReloadConfigData, 'status' | 'amountMode' | 'paymentMethodSource'> & {
    status: AutoReloadStatus;
    amountMode: AmountMode;
    paymentMethodSource: PaymentMethodSource | null;
};
type AutoReloadAttempt = Omit<AutoReloadAttemptData, 'outcome'> & {
    outcome: AttemptOutcome;
};
type AutoReloadActivity = Omit<AutoReloadActivityData, 'attempts'> & {
    attempts: AutoReloadAttempt[];
};
/** The PUT request body (client-only — a write shape, not a read-model). */
interface AutoReloadConfigUpdate {
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
/**
 * The injected transport adapter — the ONE thing a host must implement (kind 1). It wraps
 * whatever transport the host already has (axios, fetch, a server action) and points it at
 * the correct tenant + the `beam/commerce/auto-reload*` endpoints (resolved by route name); the component is
 * tenant- and URL-blind.
 */
interface AutoReloadClient {
    getConfig(): Promise<AutoReloadConfig>;
    updateConfig(body: AutoReloadConfigUpdate): Promise<AutoReloadConfig>;
    getActivity(): Promise<AutoReloadActivity>;
}
interface NotifyEvent$1 {
    type: 'success' | 'error';
    message: string;
}
/**
 * Everything host-specific, injected through one Provider. Only `client` is required
 * (kind 1); the rest have dependency-free defaults.
 */
interface AutoReloadServices {
    /** kind 1 — the transport adapter (required). */
    client: AutoReloadClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: NotifyEvent$1) => void;
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

declare function AutoReloadProvider({ services, children, }: {
    services: AutoReloadServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useAutoReloadServices(): AutoReloadServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useNotify(): (event: NotifyEvent$1) => void;
/**
 * The injected Stripe SetupIntent handler (kind 3), or a no-op when the host supplied none —
 * the honest home for the surface's original `TODO(stripe-setup-intent)` placeholder. The
 * package never owns the Stripe.js flow.
 */
declare function useSavePaymentMethod(): () => void;

declare function useAutoReloadConfig(): _tanstack_react_query.UseQueryResult<AutoReloadConfig, Error>;
declare function useAutoReloadActivity(): _tanstack_react_query.UseQueryResult<AutoReloadActivity, Error>;
declare function useUpdateAutoReloadConfig(): _tanstack_react_query.UseMutationResult<AutoReloadConfig, Error, AutoReloadConfigUpdate, unknown>;

declare function AutoReloadConfigCard({ config, canManage }: {
    config: AutoReloadConfig;
    canManage?: boolean;
}): react.JSX.Element;

declare function ReloadActivityCard({ activity }: {
    activity: AutoReloadActivity;
}): react.JSX.Element;

declare function formatUsd(value: number): string;
declare function formatDate(value: string | null | undefined): string;
/** A transport-agnostic public-error boundary for every injected commerce client. */
declare function errorMessage(error: unknown, fallback?: string): string;

/**
 * The credit-ledger entry kind the ledger badges switch on. CLOSED union: the ledger emits exactly
 * `credit` or `debit` (ticket 00, 2026-10-10 21:42Z), so — unlike the display-hint unions above — it
 * carries NO trailing `string` widening; an unknown third kind is a compile error, not a silent pass.
 */
type CreditEntryType = 'credit' | 'debit';
/** The budget-offer action the raise-cap / upgrade CTA branches on. */
type BudgetOfferAction = 'raise_cap' | 'upgrade_plan' | string;
/** The three real subscription lifecycle states the badge renders. */
/** `SubscriptionViewData::$lifecycle` (beam-commerce `SubscriptionLifecycle`): declared on the wire, `none` included (APP-10). */
type LifecycleState = 'active' | 'cancels_at_period_end' | 'lapsed' | 'none';
/** The resolved-entitlement source facet the grid isolates. */
type SourceFacet = 'all' | 'default' | 'plan' | 'tenant';
type WalletBalance = WalletBalanceData;
type CreditLedgerEntry = Omit<CreditEntryData, 'type'> & {
    type: CreditEntryType;
};
/** How a subscription is funded (purchase-walkthrough M14). Null: no funding recorded (it resolves as it always did). */
type Funding = 'card' | 'invoice' | 'comp' | 'none';
/**
 * The subscription view, with M14's funding fields. Optional until a host regenerates its `beam-resources` projection
 * from the PHP `SubscriptionData`, which now carries them.
 */
type Subscription = SubscriptionData & {
    funding?: Funding | null;
    comp?: {
        actor: string;
        reason: string;
        expiresAt: string | null;
    } | null;
    awaitingPayment?: boolean;
};
type Plan = PlanData;
type EntitlementRecord = EntitlementData;
type UpsellOffer = UpsellOfferData;
/** The client-only budget-offer narrowing — `action` as a display-hint union. */
type BudgetOffer = Omit<BudgetOfferData, 'action'> & {
    action: BudgetOfferAction;
};
type BudgetVerdict = Omit<BudgetVerdictData, 'offer'> & {
    offer: BudgetOffer | null;
};
type UsageModelBreakdown = UsageModelBreakdownData;
type UsageSummary = UsageSummaryData;
type Bill = BillData;
type BillLineItem = BillLineItemData;
/** The engine's own money-in outcome. Only `succeeded` funded the wallet. */
type CreditReloadPaymentStatus = 'succeeded' | 'failed' | 'requires_action' | 'pending' | string;
/**
 * One reload attempt's outcome on the host's configured money-in rail.
 *
 * `wallet` is the authoritative balance AFTER the attempt — unchanged on a decline. It rides the
 * result deliberately: a client that has to re-read the wallet to discover a decline changed
 * nothing has a window in which it renders a wrong number.
 */
interface CreditReloadResult {
    paymentStatus: CreditReloadPaymentStatus;
    captured: boolean;
    amountUsd: number;
    /** The rail that answered — `fake` on a sandbox host, `stripe` in production. */
    driver: string;
    /** The rail's normalized decline code; null on a captured payment. */
    declineCode: string | null;
    providerRef: string | null;
    wallet: WalletBalance;
}
/**
 * The bill-preview line item, camelCase like every other read-model (laravel-beam-commerce
 * `BillPreviewLineItemData`; review-r1 X follow-ups HIGH dropped its snake_case wire pin, with no alias).
 */
interface BillPreviewLineItem {
    componentType: string;
    description: string;
    amountUsd: number;
    metadata: Record<string, unknown>;
}
interface BillPreview {
    lineItems: BillPreviewLineItem[];
    totalUsd: number;
    /**
     * False only for the declared no-subscription empty state. Optional so an adapter or fixture written against the
     * older shape stays valid: absent reads as a plan in force (the empty state renders only on an explicit `false`).
     */
    hasActivePlan?: boolean;
}
/**
 * The plan/subscription read envelope. `subscription` is null when the tenant has never subscribed
 * (honest empty state — NOT a fabricated free row). `hasStripeId` gates the Customer Portal button;
 * `stripePriceId` gates the inline checkout CTA (free/internal plans carry none). `capabilityLabels`
 * supplies human column names for the entitlement grid, whose resolved rows arrive separately.
 */
interface SubscriptionView {
    subscription: Subscription | null;
    hasStripeId: boolean;
    stripePriceId: string | null;
    capabilityLabels: Record<string, string>;
    lifecycle: LifecycleState;
}

/** The hosted leg a top-up still needs (purchase-walkthrough BUY-02): mirrors the server's PaymentActionData. */
interface TopupCheckout {
    clientSecret: string | null;
    action?: {
        kind: 'redirect' | 'embedded';
        url?: string | null;
        clientSecret?: string | null;
    };
}
interface CommerceClient {
    getWallet(): Promise<WalletBalance>;
    /**
     * Start a hosted top-up. Returns the embedded session's `clientSecret` (null when there is none) and, since BUY-02,
     * the rail's `action`: a `redirect` leg (the fake rail's confirm page, or a redirect-mode provider checkout) is where
     * the browser must go for the purchase to settle; an `embedded` leg carries the secret to mount.
     */
    startTopupCheckout(amountUsd: number): Promise<TopupCheckout>;
    /**
     * OPTIONAL — the DIRECT-RAIL reload (`site-credits.reload`). The two credit-purchase custody
     * models the engine supports, and a host implements the one it has:
     *
     *  - **hosted custody** (`startTopupCheckout`): the browser collects the instrument, Stripe
     *    captures, a verified webhook funds the wallet later. Funding is ASYNC, so the surface shows
     *    the non-dismissable "crediting…" window;
     *  - **direct rail** (this): the server places a CreditTopup Order through the money-in driver
     *    the host has configured and the wallet is funded (or not) before the response returns.
     *    Funding is SYNCHRONOUS, so the surface can show captured / declined + retry immediately.
     *
     * Declare it and `CreditsSurface` takes the direct path; omit it and the surface keeps the
     * hosted-checkout path exactly as before — which is why this is optional rather than a second
     * component. ⚠️ A DECLINE IS A RESOLVED VALUE, not a rejection: the adapter resolves with
     * `captured: false` and the rail's code. Rejecting would collapse "the rail said no" into "the
     * request failed", and only the first one has a retry path.
     */
    reloadCredits?(amountUsd: number): Promise<CreditReloadResult>;
    getBudget(): Promise<BudgetVerdict>;
    getUsageSummary(month?: string): Promise<UsageSummary>;
    getBills(): Promise<Bill[]>;
    getBillPreview(): Promise<BillPreview | null>;
    getSubscription(): Promise<SubscriptionView>;
    /** The resolved entitlement rows (they ride `GET me` in splicewire — the host supplies them). */
    getEntitlements(): Promise<EntitlementRecord[]>;
    /**
     * Start hosted Stripe Checkout for a plan; the surface hard-navigates to the returned URL.
     * Takes the Plan ID — the backend moved onto the `plans/{id}/op/checkout` particle op, where
     * the plan rides the path segment (the old transport took a body slug).
     */
    startSubscriptionCheckout(planId: string): Promise<{
        url: string;
    }>;
    /** Get the Stripe Customer Portal URL for self-serve plan changes / cancellation. */
    getSubscriptionPortal(): Promise<{
        url: string;
    }>;
}
interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}
/**
 * Everything host-specific, injected through one Provider. Only `client` is required (kind 1); the
 * rest have dependency-free defaults.
 */
interface CommerceServices {
    /** kind 1 — the transport adapter (required). */
    client: CommerceClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: NotifyEvent) => void;
    /** kind 2 — mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * kind 3 — the host navigation slot. Stripe Checkout / Customer Portal return an off-site URL the
     * surface hands off to; navigation is host-owned (Inertia visit, `window.location`, a router). A
     * dependency-free default assigns `window.location.href` when the host injects none.
     */
    navigate?: (url: string) => void;
    /**
     * kind 3 — the tenant permission gate the billing surface reads to progressively disclose its
     * usage + bill sections (mirroring the server's in-controller abort(403)). A host wires it to its
     * own user store. Omitted → every section renders (the honest default for a host with no gate).
     */
    can?: (permission: string) => boolean;
}
declare function CommerceProvider({ services, children, }: {
    services: CommerceServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useCommerceServices(): CommerceServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useCommerceNotify(): (event: NotifyEvent) => void;
/** The injected navigation slot (kind 3), or a `window.location.href` default. */
declare function useCommerceNavigate(): (url: string) => void;
/** The injected permission gate, or an always-true default (every section renders). */
declare function useCommerceCan(): (permission: string) => boolean;

declare function useWallet(): _tanstack_react_query.UseQueryResult<_splicewire_beam_resources_types_commerce.WalletBalanceData, Error>;
declare function useCreditTopupCheckout(): _tanstack_react_query.UseMutationResult<TopupCheckout, Error, number, unknown>;
/**
 * The DIRECT-RAIL reload — the synchronous-custody sibling of {@link useCreditTopupCheckout}.
 *
 * On a captured reload the authoritative wallet rides the result, so the wallet query is SEEDED from
 * it rather than invalidated: an invalidate would round-trip to read a number the server has already
 * handed us, and the gap between the two is where a stale balance renders.
 *
 * A DECLINE is a successful mutation with `captured: false` — the rail answered. Only a transport
 * failure rejects. Callers branch on `captured`, never on `isError`, for that distinction.
 */
declare function useReloadCredits(): _tanstack_react_query.UseMutationResult<CreditReloadResult, unknown, number, unknown>;
declare function useBudget(): _tanstack_react_query.UseQueryResult<BudgetVerdict, Error>;
declare function useUsageSummary(month?: string): _tanstack_react_query.UseQueryResult<_splicewire_beam_resources_types_commerce.UsageSummaryData, Error>;
declare function useBills(): _tanstack_react_query.UseQueryResult<_splicewire_beam_resources_types_commerce.BillData[], Error>;
declare function useBillPreview(): _tanstack_react_query.UseQueryResult<BillPreview | null, Error>;
declare function useSubscription(): _tanstack_react_query.UseQueryResult<SubscriptionView, Error>;
declare function useEntitlements(): _tanstack_react_query.UseQueryResult<_splicewire_beam_resources_types_commerce.EntitlementData[], Error>;
declare function useSubscriptionCheckout(): _tanstack_react_query.UseMutationResult<{
    url: string;
}, Error, string, unknown>;
declare function useSubscriptionPortal(): _tanstack_react_query.UseMutationResult<{
    url: string;
}, Error, void, unknown>;

declare function CreditsSurface({ embedded }?: {
    embedded?: boolean;
}): react.JSX.Element;

declare function BillingSurface({ embedded, subscribeHref, }?: {
    embedded?: boolean;
    /** Where 'Choose a plan' goes from the no-active-plan preview. A host passes it only when it renders that target. */
    subscribeHref?: string;
}): react.JSX.Element;

/**
 * The optional post-checkout signal — host-router-owned (splicewire reads it off `?checkout=` via
 * react-router's useSearchParams). The package stays router-blind: the host reads its own URL and
 * passes the signal + a clear callback down. Omitted → no syncing / cancelled notices fire.
 */
interface CheckoutSignalProps {
    checkoutSignal?: 'success' | 'cancelled' | null;
    onClearCheckoutSignal?: () => void;
    embedded?: boolean;
}
declare function SubscriptionSurface({ checkoutSignal, onClearCheckoutSignal, embedded, }?: CheckoutSignalProps): react.JSX.Element;

type CommerceCustody = 'none' | 'hosted' | 'direct';
type CommerceBillingPanelSelection = 'subscription' | 'credits' | 'auto-reload';
interface CommerceBillingPanelProps extends CheckoutSignalProps {
    custody: CommerceCustody;
    selectedPanel?: CommerceBillingPanelSelection | null;
    /** The host-wrapped auto-reload surface; omitted when that capability is not installed. */
    autoReload?: ReactNode;
}
/**
 * The canonical tenant Billing composition. Usage and budget remain honest under every custody
 * posture; surfaces that require a money-in relationship do not mount at all under `none`.
 */
declare function CommerceBillingPanel({ custody, selectedPanel, autoReload, checkoutSignal, onClearCheckoutSignal, }: CommerceBillingPanelProps): react.JSX.Element;

declare function billStatusLabel(status: string): string;
declare function reloadOutcomeLabel(outcome: string): string;
declare function entitlementSourceLabel(source: string): string;

export { type AmountMode, type AttemptOutcome, type AutoReloadActivity, type AutoReloadAttempt, type AutoReloadClamps, type AutoReloadClient, type AutoReloadConfig, AutoReloadConfigCard, type AutoReloadConfigUpdate, AutoReloadProvider, type AutoReloadServices, type AutoReloadStatus, type Bill, type BillLineItem, type BillPreview, type BillPreviewLineItem, BillingSurface, type BudgetOffer, type BudgetOfferAction, type BudgetVerdict, type CheckoutSignalProps, CommerceBillingPanel, type CommerceBillingPanelProps, type CommerceBillingPanelSelection, type CommerceClient, type CommerceCustody, type NotifyEvent as CommerceNotifyEvent, CommerceProvider, type CommerceServices, type CreditEntryType, type CreditLedgerEntry, type CreditReloadPaymentStatus, type CreditReloadResult, CreditsSurface, type EntitlementRecord, type LifecycleState, type NotifyEvent$1 as NotifyEvent, type PaymentMethodSource, type Plan, ReloadActivityCard, type SourceFacet, type Subscription, SubscriptionSurface, type SubscriptionView, type TopupCheckout, type UpsellOffer, type UsageModelBreakdown, type UsageSummary, type WalletBalance, billStatusLabel, entitlementSourceLabel, errorMessage, formatDate, formatUsd, reloadOutcomeLabel, useAutoReloadActivity, useAutoReloadConfig, useAutoReloadServices, useBillPreview, useBills, useBudget, useCommerceCan, useCommerceNavigate, useCommerceNotify, useCommerceServices, useCreditTopupCheckout, useEntitlements, useNotify, useReloadCredits, useSavePaymentMethod, useSubscription, useSubscriptionCheckout, useSubscriptionPortal, useUpdateAutoReloadConfig, useUsageSummary, useWallet };
