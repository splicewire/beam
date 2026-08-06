// @splicewire/beam-commerce — the commerce-domain beam surfaces, authored pre-packaged and
// DTO-first (rehome-ui; ADR-0116 vendor seam). Mirrors PHP `splicewire/laravel-beam-commerce`.
//
// Customer-zero: the prepaid-credit auto-reload config + activity surface. A host renders it by
// supplying ONE transport adapter (+ optional feedback / the Stripe SetupIntent host slot)
// through <AutoReloadProvider>; everything else — the react-query data logic, the DTO typing off
// the generated projection, the presentation — travels inside the package.

export {
    AutoReloadProvider,
    useAutoReloadServices,
    useNotify,
    useSavePaymentMethod,
} from './provider';
export { useAutoReloadConfig, useAutoReloadActivity, useUpdateAutoReloadConfig } from './hooks';
export { AutoReloadConfigCard } from './AutoReloadConfigCard';
export { ReloadActivityCard } from './ReloadActivityCard';
export { formatUsd, formatDate, errorMessage } from './format';

// ── The three promoted commerce surfaces (Frame OS ticket 21) ────────────────────
// Credits/wallet, billing/spend-control, and subscription — each DTO-first (typed off the
// generated `commerce` projection) and host-injected through one <CommerceProvider>.
//
// ADR-0116 CAVEAT (carried, not closed): these land in beam-commerce as the CURRENT tier verdict.
// ADR-0116 defers the *final* home of some of these commerce surfaces — that question stays OPEN;
// this promotion does not close it.
export {
    CommerceProvider,
    useCommerceServices,
    useCommerceNotify,
    useCommerceNavigate,
    useCommerceCan,
} from './commerce-provider';
export {
    useWallet,
    useCreditTopupCheckout,
    useBudget,
    useUsageSummary,
    useBills,
    useBillPreview,
    useSubscription,
    useEntitlements,
    useSubscriptionCheckout,
    useSubscriptionPortal,
} from './commerce-hooks';
export { CreditsSurface } from './CreditsSurface';
export { BillingSurface } from './BillingSurface';
export { SubscriptionSurface, type CheckoutSignalProps } from './SubscriptionSurface';
export type {
    CommerceClient,
    CommerceServices,
    NotifyEvent as CommerceNotifyEvent,
} from './commerce-provider';
export type {
    WalletBalanceData,
    CreditEntryData,
    SubscriptionData,
    PlanData,
    EntitlementData,
    UpsellOfferData,
    BudgetVerdictData,
    BudgetOfferData,
    UsageSummaryData,
    UsageModelBreakdownData,
    BillData,
    BillLineItemData,
    WalletBalance,
    CreditLedgerEntry,
    CreditEntryType,
    Subscription,
    Plan,
    EntitlementRecord,
    UpsellOffer,
    BudgetOffer,
    BudgetVerdict,
    BudgetOfferAction,
    UsageSummary,
    UsageModelBreakdown,
    Bill,
    BillLineItem,
    BillPreview,
    BillPreviewLineItem,
    SubscriptionView,
    LifecycleState,
    SourceFacet,
} from './commerce-types';
export type {
    AutoReloadConfigData,
    AutoReloadClampsData,
    AutoReloadActivityData,
    AutoReloadAttemptData,
    AutoReloadStatus,
    AmountMode,
    PaymentMethodSource,
    AttemptOutcome,
    AutoReloadClamps,
    AutoReloadConfig,
    AutoReloadAttempt,
    AutoReloadActivity,
    AutoReloadConfigUpdate,
    AutoReloadClient,
    AutoReloadServices,
    NotifyEvent,
} from './types';
