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

export type MarketListingData = {
id: number,
marketId: string | null,
name: string,
summary: string | null,
kind: string,
status: string,
reviewStatus: string | null,
reviewNote: string | null,
trustTier: string,
repoFullName: string | null,
repoAuthorized: boolean,
installationNotes: string | null,
compatibility: string | null,
latestVersion: string | null,
releases: ExtensionChangelogEntryData[],
createdAt: string,
updatedAt: string | null,
};

export type MarketListingInputData = {
name: string,
summary: string | null,
repoFullName: string | null,
installationNotes: string | null,
compatibility: string | null,
};

export type MarketSellerData = {
id: string,
name: string,
isSystem: boolean,
payoutStatus: string | null,
createdAt: string,
};

export type SellerRepoAuthorizationData = {
id: string,
status: string,
installUrl: string | null,
repos: SellerRepoData[],
authorizedAt: string | null,
createdAt: string,
simulated: boolean,
};

export type SellerRepoData = {
id: number | null,
full_name: string,
};

export type ExtensionArtifactData = {
repoFullName: string,
available: boolean,
refs: string[],
ref: string | null,
packageName: string | null,
version: string | null,
description: string | null,
suggestedName: string | null,
valid: boolean,
problems: string[],
};

export type InspectArtifactInputData = {
repoFullName: string,
ref: string | null,
};

export type PublishReleaseInputData = {
ref: string,
notes: string | null,
};

export type SimulateProviderCallbackInputData = {
repos: string[],
installationId: number | null,
};

export type ReviewRejectionInputData = {
reason: string | null,
};
