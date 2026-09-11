// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type AwaitingOpsReviewData = {
status: string,
requestId: string,
action: string,
};

export type ConnectionStatusData = {
connected: boolean,
pairingGuidance: PairingGuidanceData,
};

export type PairingGuidanceData = {
connectCommand: string,
manualTokenEnvVar: string,
manualFallbackHint: string,
};

export type InstalledExtensionData = {
installId: string,
productId: number,
name: string,
kind: string,
trustTier: string,
isPlatformTier: boolean,
installedAt: string,
installedVersion: string | null,
latestVersion: string | null,
updateAvailable: boolean,
};

export type MarketExtensionData = {
id: number,
name: string,
kind: string,
categories: string[],
trustTier: string,
requiresSplicewire: boolean,
isPlatformTier: boolean,
isInstalled: boolean,
isFree: boolean,
priceLabel: string | null,
sellerName: string,
installCount: number,
description: string | null,
changelog: ExtensionChangelogEntryData[],
createdAt: string,
};

export type ExtensionChangelogEntryData = {
version: string,
notes: string,
releasedAt: string,
};
