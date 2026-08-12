// The generated Extensions-area DTO projection (rehome-ui / ADR-0116): the PHP `#[TypeScript]`
// read-models, sliced off the app's single `generated.d.ts` and delivered as the `market` bundle.
// This build-time dependency is LOAD-BEARING — each surface's default typing IS the projection,
// so the PHP source of truth genuinely travels into this package.
import type {
    ExtensionChangelogEntryData,
    ExtensionListingDetailData,
    ExtensionListingSummaryData,
    ExtensionsCatalogData,
    ExtensionsCatalogFacetsData,
    InstalledExtensionData,
} from '@splicewire/_resources/types/market';

export type {
    ExtensionChangelogEntryData,
    ExtensionListingDetailData,
    ExtensionListingSummaryData,
    ExtensionsCatalogData,
    ExtensionsCatalogFacetsData,
    InstalledExtensionData,
};

// ── Display-hint unions ─────────────────────────────────────────────────────
// The DTOs ship these fields as bare `string`; the package narrows them to the vocabulary each
// surface renders. TS-only — NOT PHP `#[TypeScript]` types — so they live here, not in the
// projected `_resources` slice.

/** The install-mechanism facet the catalog is filterable by. */
export type ListingKind = 'scaffold_pack' | 'beam_extension' | string;

/** The Official/Verified/Standard trust badge (ticket 07). */
export type TrustTier = 'Official' | 'Verified' | 'Standard' | string;

// ── Read-models (DTO + narrowed display-hint unions) ─────────────────────────

export type ExtensionListingSummary = Omit<ExtensionListingSummaryData, 'kind' | 'trustTier'> & {
    kind: ListingKind;
    trustTier: TrustTier;
};

export type ExtensionListingDetail = Omit<ExtensionListingDetailData, 'summary'> & {
    summary: ExtensionListingSummary;
};

export type ExtensionChangelogEntry = ExtensionChangelogEntryData;
export type ExtensionsCatalogFacets = ExtensionsCatalogFacetsData;

export type ExtensionsCatalog = Omit<ExtensionsCatalogData, 'listings'> & {
    listings: ExtensionListingSummary[];
};

export type InstalledExtension = Omit<InstalledExtensionData, 'kind' | 'trustTier'> & {
    kind: ListingKind;
    trustTier: TrustTier;
};

/** The `/extensions` catalog's facet filter state — both optional (no filter applied). */
export interface CatalogFilters {
    category?: string;
    kind?: ListingKind;
}
