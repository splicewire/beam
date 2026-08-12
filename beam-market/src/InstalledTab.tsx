import { Badge, Button, ListSkeleton, ListState } from '@schemastud/ui';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useInstalledExtensions, useRemoveInstalledExtension, useUpdateInstalledExtension } from './hooks';
import { TrustBadge } from './TrustBadge';
import type { InstalledExtension } from './types';

const KIND_LABELS: Record<string, string> = {
    scaffold_pack: 'Scaffold Pack',
    beam_extension: 'Beam Extension',
};

function InstalledRow({ installed }: { installed: InstalledExtension }) {
    const update = useUpdateInstalledExtension();
    const remove = useRemoveInstalledExtension();

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{installed.name}</span>
                    <TrustBadge tier={installed.trustTier} />
                    {installed.isPlatformTier && (
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                            Platform Tier
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    {KIND_LABELS[installed.kind] ?? installed.kind}
                    {installed.installedVersion ? ` · v${installed.installedVersion}` : null}
                    {installed.updateAvailable && installed.latestVersion
                        ? ` · v${installed.latestVersion} available`
                        : null}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {installed.updateAvailable && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={update.isPending}
                        onClick={() => update.mutate(installed.installId)}
                    >
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                        Update
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(installed.installId)}
                >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove
                </Button>
            </div>
        </div>
    );
}

/**
 * The Installed tab (ticket 08): a package-manager-style list over the real installed-listing
 * data source, with REAL inline Update/Remove mutations — never a read-only mirror of the catalog
 * cards. A purchased/installed listing only ever appears here through the catalog's own Install
 * action; this tab never writes anything of its own beyond Update/Remove.
 */
export function InstalledTab() {
    const { data, isPending } = useInstalledExtensions();
    const installed = data ?? [];

    return (
        <ListState
            isPending={isPending}
            hasItems={installed.length > 0}
            skeleton={<ListSkeleton variant="stack" />}
        >
            {installed.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    Nothing installed yet — install a listing from the catalog to see it here.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {installed.map((row) => (
                        <InstalledRow key={row.installId} installed={row} />
                    ))}
                </div>
            )}
        </ListState>
    );
}
