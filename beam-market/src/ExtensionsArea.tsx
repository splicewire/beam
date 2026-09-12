import { Button, cn } from '@schemastud/ui';
import { useState } from 'react';
import { ExtensionDetailSheet } from './ExtensionDetailSheet';
import { ExtensionsCatalog } from './ExtensionsCatalog';
import { InstalledTab } from './InstalledTab';
import { MarketConnectionPanel } from './MarketConnectionPanel';

type Tab = 'browse' | 'installed' | 'market';

/**
 * The beam-core Extensions area (ticket 08) — the whole `/extensions` surface a beam host mounts
 * at whatever route it likes: `Browse` (the unified catalog + its own Platform Tier section) and
 * `Installed` (the package-manager-style list). This is the ONE exported top-level component a
 * host wires up; everything else in this package is composed underneath it.
 */
export function ExtensionsArea({ className }: { className?: string }) {
    const [tab, setTab] = useState<Tab>('browse');
    const [selectedListingId, setSelectedListingId] = useState<number | null>(null);

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <div className="flex items-center gap-1 border-b">
                <TabButton active={tab === 'browse'} onClick={() => setTab('browse')}>
                    Browse
                </TabButton>
                <TabButton active={tab === 'installed'} onClick={() => setTab('installed')}>
                    Installed
                </TabButton>
                {/* ux-demo-convergence G5 (G5-CATALOG-FEDERATION) — a third seat, because "where
                    does this catalog come from" is a question about the SITE, not about any
                    listing in it. Putting it inside Browse would have made the connection state
                    something you can only see while looking at the thing it explains, and would
                    have left a site with no catalog at all (disconnected, or refused) with nowhere
                    to go. */}
                <TabButton active={tab === 'market'} onClick={() => setTab('market')}>
                    Market
                </TabButton>
            </div>

            {tab === 'browse' && <ExtensionsCatalog onSelect={setSelectedListingId} />}
            {tab === 'installed' && <InstalledTab />}
            {tab === 'market' && <MarketConnectionPanel />}

            <ExtensionDetailSheet
                listingId={selectedListingId}
                onOpenChange={(open) => {
                    if (!open) setSelectedListingId(null);
                }}
            />
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <Button
            variant="ghost"
            className={cn(
                'rounded-none border-b-2 border-transparent px-3 pb-2 font-normal text-muted-foreground hover:bg-transparent',
                active && 'border-primary font-medium text-foreground',
            )}
            onClick={onClick}
        >
            {children}
        </Button>
    );
}
