import { Badge, Button } from "@schemastud/ui";
import { AlertTriangle, Terminal } from "lucide-react";
import type { InstalledExtension } from "./types";

/**
 * What this site is ACTUALLY running for one installed listing, and what the operator still owes
 * (ux-demo-convergence G5).
 *
 * JOURNEYS.md §G5: "Deployment instructions are a valid product step. Composer extensions can
 * require a CLI deploy; the UI must say pending/instructions/detected accurately. It cannot label
 * code installed or updated because only a database row changed."
 *
 * Everything below is rendered from the server's own runtime probe (`deployment.state`,
 * `deployment.detectedVersion`) — this component computes no status of its own, so it cannot
 * disagree with the host. `lastVerifiedVersion` is the retained deployment receipt: a failed deploy
 * leaves it standing, which is the difference between "we do not know" and "we went backwards".
 */
export const DEPLOYMENT_LABELS: Record<string, string> = {
  pending: "Deploy pending",
  instructed: "Deploy pending",
  detected: "Active",
  removal_pending: "Removal pending",
  not_applicable: "Installed",
};

export function DeploymentBadge({
  installed,
}: {
  installed: InstalledExtension;
}) {
  const state = installed.deployment.state;

  if (state === "not_applicable") return null;

  return (
    <Badge
      variant={state === "detected" ? "secondary" : "outline"}
      className="font-normal"
    >
      {DEPLOYMENT_LABELS[state] ?? state}
      {state === "detected" && installed.deployment.detectedVersion
        ? ` v${installed.deployment.detectedVersion}`
        : null}
    </Badge>
  );
}

export function DeploymentPanel({
  installed,
  onRecheck,
  rechecking,
}: {
  installed: InstalledExtension;
  onRecheck?: () => void;
  rechecking?: boolean;
}) {
  const { state, instructions, error, lastVerifiedVersion, requestedVersion, notes } =
    installed.deployment;

  if (state === "detected" || state === "not_applicable") return null;

  const heading =
    state === "removal_pending"
      ? "Remove the package from this host to finish"
      : requestedVersion
        ? `Version ${requestedVersion} is not deployed on this host yet`
        : "This listing is not deployed on this host yet";

  return (
    <div
      className="mt-3 w-full rounded-md border border-dashed bg-muted/40 p-3"
      data-testid="deployment-panel"
    >
      <div className="flex items-start gap-2">
        <Terminal
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{heading}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Run these on the host, then check again. Nothing changes here until
            this site can see the package.
          </p>

          {notes && (
            // The creator's own free-text instructions: prose beside the commands, never a line inside them.
            <div className="mt-2" data-testid="deployment-notes">
              <p className="text-xs font-medium text-muted-foreground">From the creator</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{notes}</p>
            </div>
          )}

          {instructions.length > 0 && (
            <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-xs leading-relaxed">
              <code>{instructions.join("\n")}</code>
            </pre>
          )}

          {error && (
            <p
              role="alert"
              className="mt-2 flex items-start gap-1.5 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {onRecheck && (
              <Button
                variant="outline"
                size="sm"
                disabled={rechecking}
                onClick={onRecheck}
              >
                Check again
              </Button>
            )}
            {/* The retained receipt. Deliberately shown on the FAILURE panel and not only on the
                happy path: "the last deployment we actually verified" is the fact an operator
                needs while a deploy is broken, and the one a row must never quietly advance. */}
            <span className="text-xs text-muted-foreground">
              {lastVerifiedVersion
                ? `Last verified deployment: v${lastVerifiedVersion}`
                : "No deployment verified on this host yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
