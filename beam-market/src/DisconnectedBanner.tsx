import { Button } from '@schemastud/ui';
import { PlugZap } from 'lucide-react';
import { useExtensionsServices } from './provider';

/**
 * The area-wide promo banner shown whenever the site is disconnected from Splicewire (ticket 08
 * acceptance item) — read off `ExtensionsCatalog.connected`/`ExtensionListingDetail.connected`,
 * which the backend resolves from `laravel-connector`'s existing connection state (no new
 * concept). Rendered once at the top of the Extensions area, not per-listing — the per-listing
 * affordance is the lock badge + detail-sheet notice ({@see RequiresSplicewireBadge}).
 */
export function DisconnectedBanner({ marketConnected = false }: { marketConnected?: boolean }) {
    const { renderConnectCta, connectUrl } = useExtensionsServices();
    // `connected` is the Splicewire ACCOUNT pairing only; a site whose catalog comes from a connected
    // market is not "disconnected", so it must not read that way next to "Connected, N listings synced".
    const headline = marketConnected
        ? 'No Splicewire account connected'
        : "This site isn't connected to Splicewire";

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <PlugZap className="size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                    <p className="text-sm font-medium">{headline}</p>
                    <p className="text-sm text-muted-foreground">
                        Extensions marked &ldquo;Requires Splicewire&rdquo; can&apos;t be installed until you
                        connect an account.
                    </p>
                </div>
            </div>
            {renderConnectCta ? (
                renderConnectCta({ connectUrl })
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!connectUrl}
                    onClick={() => {
                        if (connectUrl && typeof window !== 'undefined') window.location.href = connectUrl;
                    }}
                >
                    Connect Splicewire
                </Button>
            )}
        </div>
    );
}
