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
export function DisconnectedBanner() {
    const { renderConnectCta, connectUrl } = useExtensionsServices();

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <PlugZap className="size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                    <p className="text-sm font-medium">This site isn&apos;t connected to Splicewire</p>
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
