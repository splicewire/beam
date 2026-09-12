export { ExtensionsArea } from "./ExtensionsArea";
export { ExtensionsCatalog } from "./ExtensionsCatalog";
export { InstalledTab } from "./InstalledTab";
export { ExtensionDetailSheet } from "./ExtensionDetailSheet";
export { TrustBadge, RequiresSplicewireBadge } from "./TrustBadge";
export { DisconnectedBanner } from "./DisconnectedBanner";
// ux-demo-convergence G5 — the deployment state a host may want to surface outside the tab.
export { DeploymentBadge, DeploymentPanel, DEPLOYMENT_LABELS } from "./DeploymentPanel";

export {
  ExtensionsProvider,
  useExtensionsServices,
  useExtensionsNotify,
} from "./provider";
export type {
  ExtensionsClient,
  ExtensionsServices,
  NotifyEvent,
} from "./provider";

export {
  useExtensionsCatalog,
  useExtensionListing,
  useConnectionStatus,
  useInstalledExtensions,
  useInstallExtension,
  useUpdateInstalledExtension,
  useRemoveInstalledExtension,
} from "./hooks";

export type {
  CatalogFilters,
  ConnectionStatus,
  ExtensionChangelogEntry,
  ExtensionListingDetail,
  ExtensionListingSummary,
  ExtensionsCatalog as ExtensionsCatalogRead,
  InstalledExtension,
  ListingKind,
  MarketExtension,
  TrustTier,
} from "./types";

export { createExtensionsClient } from "./http-client";
export type { ExtensionsRequest, ExtensionsEndpoints } from "./http-client";

// ── The CREATOR half of the marketplace (ux-demo-convergence G4) ───────────────────────────────
// The same package, the other side of the same rows: `ExtensionsArea` is what a buyer browses;
// `CreatorWorkspaceArea` is where what they browse comes from. Separate provider and separate
// query-key namespace deliberately — a catalog invalidation must not claim to have refreshed a
// creator's workspace, and a creator's draft is not in the catalog at all.
export { CreatorWorkspaceArea } from "./creator/CreatorWorkspaceArea";
export { RepositorySection } from "./creator/RepositorySection";
export { ListingsSection } from "./creator/ListingsSection";

export {
  CreatorProvider,
  useCreatorServices,
  useCreatorNotify,
  creatorErrorMessage,
} from "./creator/provider";
export type {
  CreatorClient,
  CreatorServices,
  CreatorNotifyEvent,
} from "./creator/provider";

export {
  useCreatorSeller,
  useRepoAuthorizations,
  useCreatorListings,
  useBeginAuthorization,
  useSimulateProviderCallback,
  useInspectArtifact,
  useSaveListing,
  usePublishRelease,
  useSubmitListing,
  useWithdrawListing,
} from "./creator/hooks";

export { presentListingStatus, submitBlocker } from "./creator/types";
export type {
  ExtensionArtifactData,
  ListingStatusPresentation,
  MarketListingData,
  MarketListingInputData,
  MarketSellerData,
  ReviewStatus,
  SellerRepoAuthorizationData,
} from "./creator/types";

export { createCreatorClient } from "./creator/http-client";
export type { CreatorRequest, CreatorEndpoints } from "./creator/http-client";
