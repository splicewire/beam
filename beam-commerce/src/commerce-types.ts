// The generated commerce DTO projection (rehome-ui / ADR-0116): the PHP `#[TypeScript]` billing
// read-models, sliced off the app's single `generated.d.ts` and delivered as the public
// `@splicewire/beam-resources` `commerce` bundle.
// This build-time dependency is LOAD-BEARING — each surface's default typing IS the projection, so
// the PHP source of truth genuinely travels into this package. tsup inlines these into the shipped
// `dist/index.d.ts`, so a consumer resolves them transitively via the package dep.
//
// ADR-0116 CAVEAT (carried, not closed): these three surfaces (credits/wallet, billing/spend-control,
// subscription) land in beam-commerce as the CURRENT tier verdict. ADR-0116 defers the *final* home
// of some of these commerce surfaces — that question stays OPEN; this promotion does not close it.
import type {
    BillData,
    BillLineItemData,
    BudgetOfferData,
    BudgetVerdictData,
    CreditEntryData,
    EntitlementData,
    PlanData,
    SubscriptionData,
    UpsellOfferData,
    UsageModelBreakdownData,
    UsageSummaryData,
    WalletBalanceData,
} from '@splicewire/beam-resources/types/commerce';

export type {
    BillData,
    BillLineItemData,
    BudgetOfferData,
    BudgetVerdictData,
    CreditEntryData,
    EntitlementData,
    PlanData,
    SubscriptionData,
    UpsellOfferData,
    UsageModelBreakdownData,
    UsageSummaryData,
    WalletBalanceData,
};

// ── Display-hint unions ─────────────────────────────────────────────────────
// The DTOs ship these fields as bare `string`; the package narrows them to the one vocabulary each
// surface renders (the trailing `string` keeps an unknown future value assignable). These are
// TS-only — NOT PHP `#[TypeScript]` types — so they live here, not in the projected `beam-resources` slice.

/** The credit-ledger entry kind the ledger badges switch on. */
export type CreditEntryType = 'credit' | 'debit' | string;

/** The budget-offer action the raise-cap / upgrade CTA branches on. */
export type BudgetOfferAction = 'raise_cap' | 'upgrade_plan' | string;

/** The three real subscription lifecycle states the badge renders. */
export type LifecycleState = 'active' | 'cancels_at_period_end' | 'lapsed';

/** The resolved-entitlement source facet the grid isolates. */
export type SourceFacet = 'all' | 'default' | 'plan' | 'tenant';

// ── Read-models (DTO + narrowed display-hint unions) ────────────────────────

export type WalletBalance = WalletBalanceData;

export type CreditLedgerEntry = Omit<CreditEntryData, 'type'> & {
    type: CreditEntryType;
};

export type Subscription = SubscriptionData;
export type Plan = PlanData;
export type EntitlementRecord = EntitlementData;
export type UpsellOffer = UpsellOfferData;

/** The client-only budget-offer narrowing — `action` as a display-hint union. */
export type BudgetOffer = Omit<BudgetOfferData, 'action'> & {
    action: BudgetOfferAction;
};

export type BudgetVerdict = Omit<BudgetVerdictData, 'offer'> & {
    offer: BudgetOffer | null;
};

export type UsageModelBreakdown = UsageModelBreakdownData;
export type UsageSummary = UsageSummaryData;

export type Bill = BillData;
export type BillLineItem = BillLineItemData;

// ── The direct-rail credit reload (ux-demo-convergence G3) ──────────────────
//
// Mirrors PHP `Splicewire\Beam\Commerce\Data\CreditReloadResultData`, and is declared HERE rather
// than imported from the `beam-resources` projection for one honest reason: that bundle is generated at
// splicewire-app, and splicewire-app is TENANTED — it mounts the Stripe-custody top-up, never this
// standalone surface, so its projection does not carry the DTO. When a projecting host mounts the
// standalone surface this moves up into the import block above, unchanged in shape.

/** The engine's own money-in outcome. Only `succeeded` funded the wallet. */
export type CreditReloadPaymentStatus =
    | 'succeeded'
    | 'failed'
    | 'requires_action'
    | 'pending'
    | string;

/**
 * One reload attempt's outcome on the host's configured money-in rail.
 *
 * `wallet` is the authoritative balance AFTER the attempt — unchanged on a decline. It rides the
 * result deliberately: a client that has to re-read the wallet to discover a decline changed
 * nothing has a window in which it renders a wrong number.
 */
export interface CreditReloadResult {
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

// ── Client-only wire shapes (no server DTO — write/preview shapes, not read-models) ──

/**
 * The bill-preview line item — snake_case (a raw generator array, not a projected DTO). The
 * preview endpoint returns this un-DTO'd shape, so the package narrows it here rather than off the
 * `beam-resources` projection.
 */
export interface BillPreviewLineItem {
    component_type: string;
    description: string;
    amount_usd: number;
    metadata: Record<string, unknown>;
}

export interface BillPreview {
    line_items: BillPreviewLineItem[];
    total_usd: number;
}

/**
 * The plan/subscription read envelope. `subscription` is null when the tenant has never subscribed
 * (honest empty state — NOT a fabricated free row). `hasStripeId` gates the Customer Portal button;
 * `stripePriceId` gates the inline checkout CTA (free/internal plans carry none). `capabilityLabels`
 * supplies human column names for the entitlement grid, whose resolved rows arrive separately.
 */
export interface SubscriptionView {
    subscription: Subscription | null;
    hasStripeId: boolean;
    stripePriceId: string | null;
    capabilityLabels: Record<string, string>;
}
