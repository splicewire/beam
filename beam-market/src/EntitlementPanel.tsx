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
  const repositoryKey = repositoryKeyFor(entitlement.registryUrl);
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
                  `composer config repositories.${repositoryKey} composer ${entitlement.registryUrl}`,
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
                reference you can quote to finance.

                ⚠️ "No licence recorded" is shown only when there is NOTHING — not merely when
                there is no licence ID. A federated site acquisition carries a real, working
                credential and no licence uid (the market keeps that), and printing "No licence
                recorded" directly above the key it just handed over is the panel contradicting
                itself. Measured on fresh-market 2026-09-12. */}
            {(entitlement.licenseId || entitlement.paymentRef || !key) && (
              <span className="text-xs text-muted-foreground">
                {entitlement.licenseId
                  ? `Licence ${entitlement.licenseId}`
                  : key
                    ? null
                    : "No licence recorded"}
                {entitlement.paymentRef
                  ? `${entitlement.licenseId ? " · " : ""}payment ${entitlement.paymentRef}`
                  : null}
              </span>
            )}
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

/**
 * The `repositories.<key>` name, derived from the registry's HOSTNAME.
 *
 * ⚠️ It must agree with what the server prints in the deployment step
 * (`ObserveDeployment::repositoryKey()`, `parse_url(..., PHP_URL_HOST)`), because an operator runs
 * both blocks: two different keys for one registry leaves Composer with two repository entries for
 * the same URL. A fixed `splicewire` also collided outright when a consumer connected to two
 * markets — the second `composer config` silently replaced the first. Measured on fresh-market
 * 2026-09-12, where this panel said `repositories.splicewire` and the step above it said
 * `repositories.e2e.app.splicewire.test`.
 *
 * ⚠️ `hostname`, not `host`: the KEY takes no port (it is a name), while the HTTP-Basic entry
 * below must carry one, because Composer's own auth origin includes a non-default port.
 */
function repositoryKeyFor(url: string | null): string {
  if (!url) return "market";

  try {
    return new URL(url).hostname.replace(/[^a-z0-9._-]+/gi, "-") || "market";
  } catch {
    return "market";
  }
}

function hostOf(url: string | null): string {
  if (!url) return "registry";
  try {
    return new URL(url).host;
  } catch {
    return "registry";
  }
}
