// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type WalletBalanceData = {
creditedUsd: number,
debitedUsd: number,
balanceUsd: number,
unit: string,
ledger: CreditEntryData[],
};

export type CreditEntryData = {
id: string,
at: string,
type: string,
amountUsd: number,
runningUsd: number,
reason: string,
purchaseRef: string | null,
};

export type SubscriptionData = {
id: string,
tenantId: string,
planId: string | null,
planSlug: string | null,
subscribableType: string | null,
subscribableId: string | null,
cadence: Cadence,
commitmentMonths: number | null,
overrides: Record<string, any>,
entitlements: Record<string, boolean>,
budgetLimitUsd: number | null,
startedAt: string | null,
endedAt: string | null,
active: boolean,
pausedAt: string | null,
pausedUntil: string | null,
plan: PlanData | null,
earliestBillablePeriod: string | null,
latestBillablePeriod: string | null,
};

export type PlanData = {
id: string,
slug: string,
name: string,
description: string | null,
components: PlanComponentData[],
entitlements: Record<string, boolean>,
};

export type PlanComponentData = {
type: string,
label: string,
schema: Record<string, any>,
config: Record<string, any>,
schemaRef: Record<string, string>,
};

export type EntitlementData = {
capability: string,
enabled: boolean,
source: string,
};

export type UpsellOfferData = {
plan: string,
planName: string,
priceUsd: number | null,
unit: string | null,
};

export type BudgetVerdictData = {
allowed: boolean,
uncapped: boolean,
warning: boolean,
spentUsd: number,
capUsd: number | null,
remainingUsd: number | null,
fractionUsed: number | null,
offer: BudgetOfferData | null,
bindingSourceId: string | null,
stopKind: string | null,
autoReloadPending: boolean,
};

export type BudgetOfferData = {
action: string,
message: string,
plan: string | null,
planName: string | null,
planCapUsd: number | null,
};

export type UsageSummaryData = {
month: string,
totalCostUsd: number,
totalTokens: number,
models: UsageModelBreakdownData[],
autoReloadSpendUsd: number,
autoReloadReloadCount: number,
};

export type UsageModelBreakdownData = {
model: string,
promptTokens: number,
completionTokens: number,
totalTokens: number,
costUsd: number,
};

export type BillData = {
id: string,
tenantId: string,
billingPeriod: string,
status: string,
lineItems: BillLineItemData[],
totalUsd: number,
finalizedAt: string | null,
stripeInvoiceId: string | null,
};

export type BillLineItemData = {
componentType: string,
description: string,
amountUsd: number,
metadata: Record<string, any>,
};

export type Cadence = 'one_time' | 'recurring';
