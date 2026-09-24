import { Badge, Button, ListSkeleton, ListState } from "@schemastud/ui";
import { RefreshCw, Trash2 } from "lucide-react";
import {
  useInstalledExtensions,
  useRemoveInstalledExtension,
  useUpdateInstalledExtension,
} from "./hooks";
import { DeploymentBadge, DeploymentPanel } from "./DeploymentPanel";
import { EntitlementPanel } from "./EntitlementPanel";
import { useExtensionsServices } from "./provider";
import { TrustBadge } from "./TrustBadge";
import type { InstalledExtension } from "./types";

const KIND_LABELS: Record<string, string> = {
  scaffold_pack: "Scaffold Pack",
  beam_extension: "Beam Extension",
};

function InstalledRow({ installed }: { installed: InstalledExtension }) {
  const update = useUpdateInstalledExtension();
  const remove = useRemoveInstalledExtension();
  // The abilities RefreshInstalledExtension and RemoveInstalledExtension declare; ask the host first (see `can`).
  const { can } = useExtensionsServices();
  const mayRefresh = can?.("installed-extensions.refresh") ?? true;
  const mayRemove = can?.("installed-extensions.remove") ?? true;

  return (
    // A stable handle for the row, because everything the deployment honesty rule is about — the
    // pending state, the requested version, the "available" offer — is asserted PER ROW, and a
    // browser probe addressing it by Tailwind class would be measuring the stylesheet.
    <div
      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
      data-testid="installed-extension-row"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{installed.name}</span>
          <TrustBadge tier={installed.trustTier} />
          {/* ux-demo-convergence G5 — the row's honest runtime state, from the host's own probe. */}
          <DeploymentBadge installed={installed} />
          {installed.isPlatformTier && (
            <Badge
              variant="outline"
              className="font-normal text-muted-foreground"
            >
              Platform Tier
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {KIND_LABELS[installed.kind] ?? installed.kind}
          {/* `installedVersion` is the DETECTED version and is null until a probe has seen it, so
              this line can no longer print a version for code that was never deployed. */}
          {installed.installedVersion
            ? ` · v${installed.installedVersion}`
            : null}
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
            disabled={!mayRefresh || update.isPending}
            onClick={() => update.mutate(installed.installId)}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Update
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={!mayRemove || remove.isPending}
          onClick={() => remove.mutate(installed.installId)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Remove
        </Button>
      </div>
      {(!mayRefresh || !mayRemove) && (
        <p className="w-full basis-full text-sm text-muted-foreground">
          You don't have permission to update or remove extensions on this site.
        </p>
      )}
      {/* Full-width, below the row: the CLI step the operator still owes, the observed failure,
          and the retained deployment receipt. `Check again` is the same `refresh` op the Update
          button uses — re-probing IS the documented retry. */}
      <div className="w-full basis-full">
        <DeploymentPanel
          installed={installed}
          rechecking={update.isPending}
          onRecheck={mayRefresh ? () => update.mutate(installed.installId) : undefined}
        />
        {/* ux-demo-convergence G5 — a PAID listing's deployment step needs a credential, and this
            is where the buyer reads their own. Present only when the server projected an
            entitlement for THIS reader; absent for free listings and for anyone else's purchase. */}
        {installed.entitlement && (
          <EntitlementPanel
            entitlement={installed.entitlement}
            packageName={installed.deployment.package}
          />
        )}
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
  const { data, isPending, isError } = useInstalledExtensions();
  if (isError) return <p role="alert">Could not load extensions. Try again.</p>;

  const installed = data ?? [];

  return (
    <ListState
      isPending={isPending}
      hasItems={installed.length > 0}
      skeleton={<ListSkeleton variant="stack" />}
    >
      {installed.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing installed yet — install a listing from the catalog to see it
          here.
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
