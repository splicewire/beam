import {
  Badge,
  Button,
  Input,
  ListSkeleton,
  ListState,
} from "@schemastud/ui";
import { AlertTriangle, Link2, Link2Off, RefreshCw, Store } from "lucide-react";
import { useState } from "react";
import {
  useConnectMarket,
  useDisconnectMarket,
  useMarketConnections,
  useSyncMarket,
} from "./hooks";
import type { MarketConnection } from "./types";

/**
 * The connection screen (ux-demo-convergence G5, G5-CATALOG-FEDERATION) — where this site says
 * which market its catalog comes from.
 *
 * ## Four states, four screens
 *
 * ⚠️ The whole reason this is not a connected/disconnected toggle. A site can be: not connected to
 * anything; connected and current; connected to a market that REFUSED its credential; or connected
 * to a market it could not REACH. The last two look identical if you only track a boolean, and
 * they have opposite next steps — reconnect with a credential the operator re-issues, versus press
 * Retry. JOURNEYS §G5 names that collapse explicitly ("disconnected and sync failed states are
 * honest"), so each one gets its own message, its own control, and its own `data-testid`.
 *
 * A failed sync deliberately keeps rendering the listings it last saw, with the age of that sync
 * beside them. "We could not refresh" is not "there is nothing here".
 */
function statusBadge(connection: MarketConnection) {
  switch (connection.status) {
    case "connected":
      return (
        <Badge
          variant="outline"
          className="font-normal text-emerald-600 dark:text-emerald-400"
        >
          Connected
        </Badge>
      );
    case "refused":
      // ⚠️ `outline`, not `destructive`. Measured on fresh-market 2026-09-12: the destructive
      // variant rendered a solid red pill with no legible label at all, so the one badge that has
      // to be READ was the only one that could not be. An outline badge in the destructive colour
      // matches the `error` case below and stays readable in both themes.
      return (
        <Badge variant="outline" className="font-normal text-destructive">
          Credential refused
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="font-normal text-amber-600 dark:text-amber-400">
          Sync failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          Not synced yet
        </Badge>
      );
  }
}

function syncedLabel(connection: MarketConnection): string {
  if (!connection.lastSyncedAt) return "Never synced";

  const when = new Date(connection.lastSyncedAt);

  return Number.isNaN(when.getTime())
    ? "Never synced"
    : `Last synced ${when.toLocaleString()}`;
}

function ConnectionRow({ connection }: { connection: MarketConnection }) {
  const sync = useSyncMarket();
  const disconnect = useDisconnectMarket();

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border p-4"
      data-testid="market-connection"
      data-status={connection.status}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Store
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium">
                {connection.marketName || connection.marketUrl}
              </span>
              {statusBadge(connection)}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {connection.marketUrl}
            </p>
            <p className="text-sm text-muted-foreground">
              {/* The catalog's own provenance, in one line: how many listings this market is
                  offering this site, and how old that answer is. */}
              {connection.listingCount}{" "}
              {connection.listingCount === 1 ? "listing" : "listings"} ·{" "}
              {syncedLabel(connection)}
              {connection.credentialHint
                ? ` · key …${connection.credentialHint}`
                : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={sync.isPending}
            onClick={() => sync.mutate(connection.id)}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Re-sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate(connection.id)}
          >
            <Link2Off className="size-3.5" aria-hidden="true" />
            Disconnect
          </Button>
        </div>
      </div>

      {connection.registryUrl ? (
        <p className="text-xs text-muted-foreground">
          Packages resolve from{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {connection.registryUrl}
          </code>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          This market publishes a catalog and distributes no packages.
        </p>
      )}

      {/* The verbatim failure. The half of a failed sync an operator can act on — and the reason
          `lastSyncError` is a column rather than a log line. */}
      {connection.lastSyncError && (
        <p
          role="alert"
          data-testid="market-connection-error"
          className="flex items-start gap-1.5 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {/* The server's own sentence already names the refusal and what to do; a local prefix
              saying the same thing twice is noise, so only the action the server cannot know about
              — "connect again below", which is a fact about THIS screen — is added. */}
          <span>
            {connection.lastSyncError}
            {connection.status === "refused"
              ? " Ask its operator to issue a new one, then connect again below."
              : null}
          </span>
        </p>
      )}
    </div>
  );
}

function ConnectForm() {
  const connect = useConnectMarket();
  const [marketUrl, setMarketUrl] = useState("");
  const [credential, setCredential] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    connect.mutate(
      { marketUrl, credential },
      {
        onSuccess: () => {
          setMarketUrl("");
          setCredential("");
        },
      },
    );
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-dashed p-4"
      onSubmit={submit}
      data-testid="market-connect-form"
    >
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Connect to a market</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Paste the market&apos;s address and the connection credential its
        operator issued for this site. The credential is checked against that
        market before anything is saved.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Market URL"
          placeholder="https://market.example.com"
          value={marketUrl}
          onChange={(e) => setMarketUrl(e.target.value)}
          className="sm:flex-1"
        />
        <Input
          aria-label="Connection credential"
          type="password"
          placeholder="Connection credential"
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          className="sm:flex-1"
        />
        <Button
          type="submit"
          disabled={connect.isPending || !marketUrl || !credential}
        >
          {connect.isPending ? "Connecting…" : "Connect"}
        </Button>
      </div>
    </form>
  );
}

/**
 * The Market tab's body: every connection this site holds, and the form to add one.
 */
export function MarketConnectionPanel() {
  const { data, isPending, isError } = useMarketConnections();

  if (isError) {
    return <p role="alert">Could not load market connections. Try again.</p>;
  }

  const connections = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <ListState
        isPending={isPending}
        hasItems={connections.length > 0}
        skeleton={<ListSkeleton variant="stack" />}
      >
        {connections.length === 0 ? (
          <p
            className="py-6 text-center text-sm text-muted-foreground"
            data-testid="market-disconnected"
          >
            This site isn&apos;t connected to a market. Its catalog is whatever
            has been published here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {connections.map((connection) => (
              <ConnectionRow key={connection.id} connection={connection} />
            ))}
          </div>
        )}
      </ListState>

      <ConnectForm />
    </div>
  );
}
