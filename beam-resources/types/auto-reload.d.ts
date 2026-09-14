// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type AutoReloadConfigData = {
enabled: boolean,
status: string,
thresholdUsd: number,
amountMode: string,
reloadAmountUsd: number | null,
targetUsd: number | null,
cooldownSeconds: number | null,
maxReloadsPerPeriod: number | null,
maxSpendPerPeriodUsd: number | null,
maxPerReloadUsd: number | null,
periodDays: number,
hasPaymentMethod: boolean,
paymentMethodSource: string | null,
disabledReason: string | null,
consecutiveFailures: number,
clamps: AutoReloadClampsData,
};

export type AutoReloadClampsData = {
minCooldownSeconds: number,
maxReloadsCeiling: number,
maxSpendCeilingUsd: number,
maxPerReloadCeilingUsd: number,
effectiveCooldownSeconds: number,
effectiveMaxReloadsPerPeriod: number,
effectiveMaxSpendPerPeriodUsd: number,
effectiveMaxPerReloadUsd: number,
};

export type AutoReloadActivityData = {
lastReloadAt: string | null,
lastReloadAmountUsd: number | null,
attempts: AutoReloadAttemptData[],
};

export type AutoReloadAttemptData = {
createdAt: string,
outcome: string,
amountUsd: number | null,
stripeErrorCode: string | null,
};
