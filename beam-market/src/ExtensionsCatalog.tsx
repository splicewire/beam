import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    ListSkeleton,
    ListState,
    SimpleSelect,
} from '@schemastud/ui';
import { useState } from 'react';
import { DisconnectedBanner } from './DisconnectedBanner';
import { useConnectionStatus, useExtensionsCatalog } from './hooks';
import { RequiresSplicewireBadge, TrustBadge } from './TrustBadge';
import type { CatalogFilters, ExtensionListingSummary } from './types';

const KIND_LABELS: Record<string, string> = {
    scaffold_pack: 'Scaffold Pack',
    beam_extension: 'Beam Extension',
};

function kindLabel(kind: string): string {
    return KIND_LABELS[kind] ?? kind;
}

function ListingCard({
    listing,
    onSelect,
}: {
    listing: ExtensionListingSummary;
    onSelect: (id: number) => void;
}) {
    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect(listing.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(listing.id);
            }}
            className="cursor-pointer transition-colors hover:border-primary/40"
        >
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{listing.name}</CardTitle>
                    {listing.requiresSplicewire && <RequiresSplicewireBadge />}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <TrustBadge tier={listing.trustTier} />
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                        {kindLabel(listing.kind)}
                    </Badge>
                    {listing.isInstalled && (
                        <Badge variant="outline" className="font-normal text-emerald-600 dark:text-emerald-400">
                            Installed
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{listing.sellerName}</span>
                <span className="font-medium text-foreground">{listing.isFree ? 'Free' : listing.priceLabel}</span>
            </CardContent>
        </Card>
    );
}

/** The install-mechanism facet is a fixed two-value vocabulary — the "All kinds" dropdown options,
 * static (ticket 08 revision: the catalog no longer computes a `facets.kinds` vocabulary
 * server-side; there are only ever these two install mechanisms). */
const KIND_OPTIONS = [
    { value: '', label: 'All kinds' },
    { value: 'scaffold_pack', label: 'Scaffold Pack' },
    { value: 'beam_extension', label: 'Beam Extension' },
];

/**
 * The unified `/extensions` catalog (ticket 08, REVISED): ONE surface for both listing kinds, an
 * install-mechanism (`kind`) facet, a category facet, and its own "Platform Tier" Browse section for
 * Satellite/Tower — pulled out of the generic grid purely by `isPlatformTier`, never a second
 * endpoint or listing kind. The area-wide disconnected promo banner renders here, once, off the
 * site-wide `useConnectionStatus()` fact (no longer bundled into the catalog response — see that
 * hook's own docblock). The category filter is a free-text Silo-slug box, not a dropdown: the
 * catalog no longer computes a `facets.categories` vocabulary server-side (the declarative
 * `market-extensions` particle resource has no facet-computation step) — a host wanting a dropdown
 * can build one off its own Silo list (e.g. the `/silos` resource) and pass the chosen slug through
 * `filters.category` unchanged.
 */
export function ExtensionsCatalog({ onSelect }: { onSelect: (id: number) => void }) {
    const [filters, setFilters] = useState<CatalogFilters>({});
    const { data, isPending } = useExtensionsCatalog(filters);
    const { data: connectionStatus } = useConnectionStatus();

    const listings = data?.listings ?? [];
    const platformTier = listings.filter((l) => l.isPlatformTier);
    const rest = listings.filter((l) => !l.isPlatformTier);

    return (
        <div className="flex flex-col gap-6">
            {connectionStatus && !connectionStatus.connected && <DisconnectedBanner />}

            <div className="flex flex-wrap items-center gap-2">
                <Input
                    aria-label="Filter by category"
                    value={filters.category ?? ''}
                    onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
                    placeholder="Filter by category…"
                    className="w-48"
                />
                <SimpleSelect
                    aria-label="Filter by kind"
                    value={filters.kind ?? ''}
                    onValueChange={(value) => setFilters((f) => ({ ...f, kind: value || undefined }))}
                    options={KIND_OPTIONS}
                    placeholder="All kinds"
                />
                {(filters.category || filters.kind) && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                        Clear filters
                    </Button>
                )}
            </div>

            <ListState isPending={isPending} hasItems={listings.length > 0} skeleton={<ListSkeleton variant="grid" />}>
                <div className="flex flex-col gap-6">
                    {platformTier.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Platform Tier</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {platformTier.map((listing) => (
                                    <ListingCard key={listing.id} listing={listing} onSelect={onSelect} />
                                ))}
                            </div>
                        </section>
                    )}
                    {rest.length > 0 && (
                        <section className="flex flex-col gap-3">
                            {platformTier.length > 0 && (
                                <h3 className="text-sm font-semibold text-muted-foreground">Extensions</h3>
                            )}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {rest.map((listing) => (
                                    <ListingCard key={listing.id} listing={listing} onSelect={onSelect} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </ListState>
        </div>
    );
}
