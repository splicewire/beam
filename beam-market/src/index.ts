export { ExtensionsArea } from './ExtensionsArea';
export { ExtensionsCatalog } from './ExtensionsCatalog';
export { InstalledTab } from './InstalledTab';
export { ExtensionDetailSheet } from './ExtensionDetailSheet';
export { TrustBadge, RequiresSplicewireBadge } from './TrustBadge';
export { DisconnectedBanner } from './DisconnectedBanner';

export {
    ExtensionsProvider,
    useExtensionsServices,
    useExtensionsNotify,
} from './provider';
export type { ExtensionsClient, ExtensionsServices, NotifyEvent } from './provider';

export {
    useExtensionsCatalog,
    useExtensionListing,
    useInstalledExtensions,
    useInstallExtension,
    useUpdateInstalledExtension,
    useRemoveInstalledExtension,
} from './hooks';

export type {
    CatalogFilters,
    ExtensionChangelogEntry,
    ExtensionListingDetail,
    ExtensionListingSummary,
    ExtensionsCatalog as ExtensionsCatalogRead,
    ExtensionsCatalogFacets,
    InstalledExtension,
    ListingKind,
    TrustTier,
} from './types';
