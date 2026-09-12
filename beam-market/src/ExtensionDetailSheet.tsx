import {
  Badge,
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@schemastud/ui";
import { AlertTriangle, Lock } from "lucide-react";
import { useEffect } from "react";
import { EntitlementPanel } from "./EntitlementPanel";
import {
  useConnectionStatus,
  useExtensionListing,
  useInstallExtension,
  usePurchaseExtension,
} from "./hooks";
import { extensionsErrorMessage, useExtensionsServices } from "./provider";
import { RequiresSplicewireBadge, TrustBadge } from "./TrustBadge";

const KIND_LABELS: Record<string, string> = {
  scaffold_pack: "Scaffold Pack",
  beam_extension: "Beam Extension",
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
  const { data, isError } = useExtensionListing(listingId);
  const { data: connectionStatus } = useConnectionStatus();
  const install = useInstallExtension();
  const purchase = usePurchaseExtension();
  const { renderConnectCta, connectUrl } = useExtensionsServices();
  const { reset: resetInstall } = install;
  const { reset: resetPurchase } = purchase;
  useEffect(() => {
    resetInstall();
    resetPurchase();
  }, [listingId, resetInstall, resetPurchase]);

  const awaitingReview =
    install.data &&
    "status" in install.data &&
    install.data.status === "awaiting_ops_review";
  const gatedAndDisconnected =
    Boolean(data?.requiresSplicewire) && connectionStatus?.connected === false;

  // ux-demo-convergence G5 — the paid-listing states, read off the server's own facts: `isFree` and
  // `isEntitled` are the row's, the mutation's own status is the rest. Nothing here decides whether
  // a buyer is entitled; it only decides what to show about the answer.
  const justPurchased = purchase.data?.entitlement ?? null;
  // `purchase.isSuccess` counts as owning it: the server has already written the entitlement, and
  // the detail row's own refetch can land a moment later. Keeping Buy on screen in that gap would
  // invite a second checkout for something the buyer just bought.
  const needsPurchase =
    Boolean(data) && !data!.isFree && !data!.isEntitled && !purchase.isSuccess;

  return (
    <Sheet open={listingId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        {isError && <p role="alert">Could not load this extension.</p>}
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
                <Badge
                  variant="outline"
                  className="font-normal text-muted-foreground"
                >
                  {KIND_LABELS[data.kind] ?? data.kind}
                </Badge>
                {data.isPlatformTier && (
                  <Badge
                    variant="outline"
                    className="font-normal text-muted-foreground"
                  >
                    Platform Tier
                  </Badge>
                )}
                {/* Paid AND bought: the one badge that distinguishes "you may install this" from
                    "you may buy this", both of which otherwise look like a price. */}
                {!data.isFree && (data.isEntitled || purchase.isSuccess) && (
                  <Badge
                    variant="outline"
                    className="font-normal text-emerald-600 dark:text-emerald-400"
                  >
                    Purchased
                  </Badge>
                )}
              </div>

              {gatedAndDisconnected && (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="size-4 shrink-0" aria-hidden="true" />
                    This listing requires a connected Splicewire account.
                  </p>
                  {connectionStatus?.pairingGuidance && (
                    // The guided pairing step (splicewire-marketplace-build ticket 10):
                    // `PairingGuidanceData` rode the wire with no consumer until this
                    // block — the copy is the DTO's, never authored here.
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="text-muted-foreground">
                        Pair this site from its own terminal, then approve in
                        your browser:
                      </p>
                      <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        {connectionStatus.pairingGuidance.connectCommand}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        {connectionStatus.pairingGuidance.manualFallbackHint}{" "}
                        (sets{" "}
                        <code className="font-mono">
                          {connectionStatus.pairingGuidance.manualTokenEnvVar}
                        </code>
                        ).
                      </p>
                    </div>
                  )}
                  {renderConnectCta ? (
                    renderConnectCta({ connectUrl })
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!connectUrl}
                      onClick={() => {
                        if (connectUrl && typeof window !== "undefined") {
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
                <span className="text-sm text-muted-foreground">
                  by {data.sellerName}
                </span>
                <span className="font-medium">
                  {data.isFree ? "Free" : data.priceLabel}
                </span>
              </div>

              {/* A paid listing this buyer has not bought: the Buy control IS the acquisition
                  path, and Install stays refused until a real checkout yields a real entitlement
                  (the server refuses it too — this button is the honest mirror of a 403, not the
                  gate itself). */}
              {needsPurchase ? (
                <Button
                  disabled={purchase.isPending || gatedAndDisconnected}
                  onClick={() => purchase.mutate(data.id)}
                >
                  {purchase.isPending
                    ? "Purchasing…"
                    : purchase.isError
                      ? "Try again"
                      : `Buy ${data.priceLabel ?? ""}`.trim()}
                </Button>
              ) : (
                <Button
                  disabled={
                    data.isInstalled ||
                    install.isPending ||
                    gatedAndDisconnected ||
                    Boolean(awaitingReview) ||
                    (data.requiresSplicewire && !connectionStatus)
                  }
                  onClick={() => install.mutate(data.id)}
                >
                  {awaitingReview
                    ? "Awaiting review"
                    : data.isInstalled
                      ? "Installed"
                      : "Install"}
                </Button>
              )}

              {/* The failure state, on the surface rather than only in a toast: a decline is
                  recoverable and the buyer needs both the reason and the retry in front of them. */}
              {purchase.isError && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 text-sm text-destructive"
                >
                  <AlertTriangle
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {extensionsErrorMessage(
                    purchase.error,
                    "The payment was not completed. Nothing was purchased.",
                  )}
                </p>
              )}

              {/* The credential, the moment it exists. It also lives on the Installed tab, because
                  a deploy happens later and on another machine. */}
              {justPurchased && (
                <EntitlementPanel entitlement={justPurchased} />
              )}

              {data.changelog.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold">Changelog</h4>
                    {data.changelog.map((entry) => (
                      <div key={entry.version} className="text-sm">
                        <span className="font-medium">v{entry.version}</span>{" "}
                        <span className="text-muted-foreground">
                          {entry.notes}
                        </span>
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
