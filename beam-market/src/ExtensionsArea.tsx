import { Button, cn } from '@schemastud/ui';
import { useState } from 'react';
import { ExtensionDetailSheet } from './ExtensionDetailSheet';
import { ExtensionsCatalog } from './ExtensionsCatalog';
import { InstalledTab } from './InstalledTab';

type Tab = 'browse' | 'installed';

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
            </div>

            {tab === 'browse' ? (
                <ExtensionsCatalog onSelect={setSelectedListingId} />
            ) : (
                <InstalledTab />
            )}

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
