import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    ListSkeleton,
    ListState,
    SimpleSelect,
} from '@schemastud/ui';
import { useState } from 'react';
import { DisconnectedBanner } from './DisconnectedBanner';
import { useExtensionsCatalog } from './hooks';
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

/**
 * The unified `/extensions` catalog (ticket 08): ONE surface for both listing kinds, an
 * install-mechanism (`kind`) facet, category facet, and an own "Platform Tier" Browse section for
 * Satellite/Tower — pulled out of the generic grid purely by `isPlatformTier`, never a second
 * endpoint or listing kind. The area-wide disconnected promo banner renders here, once, off the
 * SAME `connected` fact the catalog query already carries.
 */
export function ExtensionsCatalog({ onSelect }: { onSelect: (id: number) => void }) {
    const [filters, setFilters] = useState<CatalogFilters>({});
    const { data, isPending } = useExtensionsCatalog(filters);

    const listings = data?.listings ?? [];
    const platformTier = listings.filter((l) => l.isPlatformTier);
    const rest = listings.filter((l) => !l.isPlatformTier);

    // Explicit parameter typing sidesteps a fleet-wide quirk: the generated `_resources` bundle's
    // nested cross-refs (e.g. `ExtensionsCatalogData.facets`) resolve via a dotted namespace path
    // that's only fully declared in the app's own `generated.d.ts` — outside that context (an
    // isolated package's own `tsc`), `skipLibCheck` silently widens the unresolved ref to `any`
    // rather than erroring (the SAME shape `beam-commerce`'s `WalletBalanceData.ledger` carries;
    // it just never hits an inline `.map()` there). The facet arrays are genuinely `string[]` at
    // runtime — this is a type-inference sidestep, not a behavior change.
    const categories: string[] = data?.facets.categories ?? [];
    const kinds: string[] = data?.facets.kinds ?? [];
    const categoryOptions = [
        { value: '', label: 'All categories' },
        ...categories.map((c: string) => ({ value: c, label: c })),
    ];
    const kindOptions = [
        { value: '', label: 'All kinds' },
        ...kinds.map((k: string) => ({ value: k, label: kindLabel(k) })),
    ];

    return (
        <div className="flex flex-col gap-6">
            {data && !data.connected && <DisconnectedBanner />}

            <div className="flex flex-wrap items-center gap-2">
                <SimpleSelect
                    aria-label="Filter by category"
                    value={filters.category ?? ''}
                    onValueChange={(value) => setFilters((f) => ({ ...f, category: value || undefined }))}
                    options={categoryOptions}
                    placeholder="All categories"
                />
                <SimpleSelect
                    aria-label="Filter by kind"
                    value={filters.kind ?? ''}
                    onValueChange={(value) => setFilters((f) => ({ ...f, kind: value || undefined }))}
                    options={kindOptions}
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
