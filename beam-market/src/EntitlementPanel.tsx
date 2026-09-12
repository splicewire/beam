import { Button } from "@schemastud/ui";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import type { MarketEntitlement } from "./types";

/**
 * The buyer's own registry credential (ux-demo-convergence G5) — delivered through the product,
 * beside the deployment step that needs it.
 *
 * JOURNEYS.md §G5 allows a CLI deploy as a real product step, and for a PAID listing that step is
 * not runnable without a credential: the Composer registry authenticates every request over HTTP
 * Basic against the licence key a purchase mints. Printing `composer require …` without it would be
 * printing an instruction that cannot succeed.
 *
 * The key is hidden until asked for. It is the reader's own — the server projects an entitlement
 * only for its owner — but "the buyer is looking at their screen" and "the buyer is sharing their
 * screen" are the same moment from here, so revealing it is a deliberate act rather than a page
 * load. Nothing is stored in the browser.
 */
export function EntitlementPanel({
  entitlement,
  packageName,
}: {
  entitlement: MarketEntitlement;
  packageName?: string | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const registryHost = hostOf(entitlement.registryUrl);
  const key = entitlement.licenseKey;

  return (
    <div
      className="mt-3 w-full rounded-md border bg-muted/30 p-3"
      data-testid="entitlement-panel"
    >
      <div className="flex items-start gap-2">
        <KeyRound
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            Your licence
            {entitlement.amountLabel ? ` · ${entitlement.amountLabel}` : null}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {entitlement.registryUrl
              ? "Authenticate Composer with this key, then run the deployment step."
              : "This purchase is licensed. No package registry is configured on this host."}
          </p>

          {entitlement.registryUrl && (
            <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-xs leading-relaxed">
              <code>
                {[
                  `composer config repositories.splicewire composer ${entitlement.registryUrl}`,
                  `composer config --global --auth http-basic.${registryHost} ${entitlement.registryUsername} ${revealed && key ? key : "<your key>"}`,
                  packageName ? `composer require ${packageName}` : null,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </code>
            </pre>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {key && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealed((shown) => !shown)}
              >
                {revealed ? "Hide key" : "Show key"}
              </Button>
            )}
            {/* Licensing and payment are distinct records, and the panel says so rather than
                implying one is the other: a licence id you can quote to support, a payment
                reference you can quote to finance. */}
            <span className="text-xs text-muted-foreground">
              {entitlement.licenseId
                ? `Licence ${entitlement.licenseId}`
                : "No licence recorded"}
              {entitlement.paymentRef ? ` · payment ${entitlement.paymentRef}` : null}
            </span>
          </div>

          {revealed && key && (
            <p
              data-testid="entitlement-key"
              className="mt-2 break-all rounded bg-background p-2 font-mono text-xs"
            >
              {key}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function hostOf(url: string | null): string {
  if (!url) return "registry";
  try {
    return new URL(url).host;
  } catch {
    return "registry";
  }
}
