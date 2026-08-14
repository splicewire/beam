// The generated Extensions-area DTO projection (rehome-ui / ADR-0116): the PHP `#[TypeScript]`
// read-models, sliced off the app's single `generated.d.ts` and delivered as the `market` bundle.
// This build-time dependency is LOAD-BEARING — each surface's default typing IS the projection,
// so the PHP source of truth genuinely travels into this package.
//
// splicewire-marketplace-build ticket 08 (REVISION): the catalog no longer projects a bespoke
// `ExtensionsCatalogData`/`ExtensionListingSummaryData`/`ExtensionListingDetailData` split — ONE
// `MarketExtensionData` shape now serves both the list row AND the detail sheet (the fleet's
// declarative `#[ParticleResource]` pattern projects list/show through the SAME `project()`, so
// there is no server-side summary/detail narrowing any more). `connected`/`pairingGuidance` moved
// off every row onto their own `ConnectionStatusData`, fetched once (see `useConnectionStatus`).
import type {
    ConnectionStatusData,
    ExtensionChangelogEntryData,
    InstalledExtensionData,
    MarketExtensionData,
    PairingGuidanceData,
} from '@splicewire/_resources/types/market';

export type { ConnectionStatusData, ExtensionChangelogEntryData, InstalledExtensionData, MarketExtensionData, PairingGuidanceData };

// ── Display-hint unions ─────────────────────────────────────────────────────
// The DTOs ship these fields as bare `string`; the package narrows them to the vocabulary each
// surface renders. TS-only — NOT PHP `#[TypeScript]` types — so they live here, not in the
// projected `_resources` slice.

/** The install-mechanism facet the catalog is filterable by. */
export type ListingKind = 'scaffold_pack' | 'beam_extension' | string;

/** The Official/Verified/Standard trust badge (ticket 07). */
export type TrustTier = 'Official' | 'Verified' | 'Standard' | string;

// ── Read-models (DTO + narrowed display-hint unions) ─────────────────────────

/**
 * A catalog row/detail row — the SAME shape (`MarketExtensionData`) serves both the grid card and
 * the detail sheet now, so `ExtensionListingSummary`/`ExtensionListingDetail` are aliases of one
 * another, kept as distinct names only so call sites documenting "this is a summary" vs "this is a
 * detail" don't need to rename.
 */
export type MarketExtension = Omit<MarketExtensionData, 'kind' | 'trustTier'> & {
    kind: ListingKind;
    trustTier: TrustTier;
};

export type ExtensionListingSummary = MarketExtension;
export type ExtensionListingDetail = MarketExtension;

export type ExtensionChangelogEntry = ExtensionChangelogEntryData;

/** The catalog list — a thin wrapper (not just a bare array) so a future page/cursor fact has somewhere to land. */
export type ExtensionsCatalog = {
    listings: MarketExtension[];
};

export type InstalledExtension = Omit<InstalledExtensionData, 'kind' | 'trustTier'> & {
    kind: ListingKind;
    trustTier: TrustTier;
};

/**
 * The Extensions area's SITE-WIDE connection fact (ticket 08 revision) — whether this beam site has
 * a paired Splicewire connection, fetched ONCE (`useConnectionStatus`), never per-listing. A
 * listing's own `pairingGuidance` visibility is a pure client-side combination of THIS `connected`
 * flag and that listing's own `requiresSplicewire`.
 */
export type ConnectionStatus = ConnectionStatusData;

/** The `/extensions` catalog's facet filter state — both optional (no filter applied). `category`
 * is a Silo slug, `kind` the install-mechanism token; a host's `ExtensionsClient.getCatalog`
 * implementation maps these onto the data-filters query-param convention
 * (`?filter[category]=…&filter[kind]=…`), not the retired bespoke `?category=&kind=` pair. */
export interface CatalogFilters {
    category?: string;
    kind?: ListingKind;
}
