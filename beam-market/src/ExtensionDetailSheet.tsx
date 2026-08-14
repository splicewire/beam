import {
    Badge,
    Button,
    Separator,
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@schemastud/ui';
import { Lock } from 'lucide-react';
import { useConnectionStatus, useExtensionListing, useInstallExtension } from './hooks';
import { useExtensionsServices } from './provider';
import { RequiresSplicewireBadge, TrustBadge } from './TrustBadge';

const KIND_LABELS: Record<string, string> = {
    scaffold_pack: 'Scaffold Pack',
    beam_extension: 'Beam Extension',
};

/**
 * The Extensions area's detail sheet (ticket 08, REVISED): the trust badge, the full
 * `requires_splicewire` notice + "Connect Splicewire to install" CTA when gated and disconnected,
 * the changelog, and the Install action — the ONE place (alongside the Installed tab's own actions)
 * a Listing's install state actually changes. `data` is now the FLAT `MarketExtension` shape (no
 * more `.summary` wrapper — the particle resource projects list/show through the same shape);
 * `connected` no longer rides the listing response at all — it's `useConnectionStatus()`, the
 * site-wide fact fetched once.
 */
export function ExtensionDetailSheet({
    listingId,
    onOpenChange,
}: {
    listingId: number | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { data } = useExtensionListing(listingId);
    const { data: connectionStatus } = useConnectionStatus();
    const install = useInstallExtension();
    const { renderConnectCta, connectUrl } = useExtensionsServices();

    const gatedAndDisconnected = Boolean(data?.requiresSplicewire) && connectionStatus?.connected === false;

    return (
        <Sheet open={listingId !== null} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
                {data && (
                    <>
                        <SheetHeader>
                            <div className="flex items-start justify-between gap-2">
                                <SheetTitle>{data.name}</SheetTitle>
                                {data.requiresSplicewire && <RequiresSplicewireBadge />}
                            </div>
                            <SheetDescription>{data.description}</SheetDescription>
                        </SheetHeader>

                        <div className="flex flex-col gap-4 px-4 pb-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <TrustBadge tier={data.trustTier} />
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                    {KIND_LABELS[data.kind] ?? data.kind}
                                </Badge>
                                {data.isPlatformTier && (
                                    <Badge variant="outline" className="font-normal text-muted-foreground">
                                        Platform Tier
                                    </Badge>
                                )}
                            </div>

                            {gatedAndDisconnected && (
                                <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <Lock className="size-4 shrink-0" aria-hidden="true" />
                                        This listing requires a connected Splicewire account.
                                    </p>
                                    {renderConnectCta ? (
                                        renderConnectCta({ connectUrl })
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!connectUrl}
                                            onClick={() => {
                                                if (connectUrl && typeof window !== 'undefined') {
                                                    window.location.href = connectUrl;
                                                }
                                            }}
                                        >
                                            Connect Splicewire to install
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">by {data.sellerName}</span>
                                <span className="font-medium">{data.isFree ? 'Free' : data.priceLabel}</span>
                            </div>

                            <Button
                                disabled={data.isInstalled || install.isPending || gatedAndDisconnected}
                                onClick={() => install.mutate(data.id)}
                            >
                                {data.isInstalled ? 'Installed' : 'Install'}
                            </Button>

                            {data.changelog.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex flex-col gap-3">
                                        <h4 className="text-sm font-semibold">Changelog</h4>
                                        {data.changelog.map((entry) => (
                                            <div key={entry.version} className="text-sm">
                                                <span className="font-medium">v{entry.version}</span>{' '}
                                                <span className="text-muted-foreground">{entry.notes}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
