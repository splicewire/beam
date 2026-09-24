import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExtensionsProvider, type ExtensionsClient } from "../src/provider";
import { MarketConnectionPanel } from "../src/MarketConnectionPanel";
import type { MarketConnection } from "../src/types";

/**
 * ux-demo-convergence G5 (G5-CATALOG-FEDERATION) — the connection screen's four states, and the
 * one distinction the whole surface turns on.
 *
 * JOURNEYS §G5: *"'disconnected' and 'sync failed' states are honest."* A boolean cannot carry
 * that: a site whose credential the market REVOKED and a site that could not REACH its market look
 * identical to one, and their next steps are opposite — reconnect with a re-issued credential
 * versus press Retry. These cases are what stop the two collapsing back together.
 */
const connected: MarketConnection = {
  id: "conn-1",
  marketUrl: "https://market.example.test",
  marketName: "Splicewire Market",
  status: "connected",
  registryUrl: "https://market.example.test/registry",
  registryUsername: "composer",
  lastSyncedAt: "2026-09-12T12:00:00Z",
  lastSyncError: null,
  listingCount: 2,
  credentialHint: "9f2c",
  createdAt: "2026-09-12T11:00:00Z",
};

function client(overrides: Partial<ExtensionsClient> = {}): ExtensionsClient {
  return {
    getCatalog: vi.fn(async () => ({ listings: [] })),
    getListing: vi.fn(),
    getConnectionStatus: vi.fn(async () => ({
      connected: false,
      pairingGuidance: {
        connectCommand: "php artisan splicewire:connect",
        manualTokenEnvVar: "SPLICEWIRE_TOKEN",
        manualFallbackHint: "Use a personal access token.",
      },
      markets: [],
    })),
    getInstalled: vi.fn(async () => []),
    install: vi.fn(),
    purchase: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    connectMarket: vi.fn(async () => connected),
    syncMarket: vi.fn(async () => connected),
    disconnectMarket: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as ExtensionsClient;
}

function mount(services: ExtensionsClient, notify = vi.fn()) {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={cache}>
      <ExtensionsProvider services={{ client: services, notify }}>
        <MarketConnectionPanel />
      </ExtensionsProvider>
    </QueryClientProvider>,
  );

  return notify;
}

function statusFixture(over: Partial<MarketConnection>) {
  return vi.fn(async () => ({
    connected: false,
    pairingGuidance: {
      connectCommand: "php artisan splicewire:connect",
      manualTokenEnvVar: "SPLICEWIRE_TOKEN",
      manualFallbackHint: "Use a personal access token.",
    },
    markets: [{ ...connected, ...over }],
  }));
}

describe("the market connection screen", () => {
  it("omits unsupported connection actions while preserving an available re-sync", async () => {
    const syncMarket = vi.fn(async () => connected);
    mount(
      client({
        getConnectionStatus: statusFixture({
          status: "refused",
          lastSyncError: "Credential refused.",
        }),
        connectMarket: undefined,
        disconnectMarket: undefined,
        syncMarket,
      }),
    );
    expect(
      await screen.findByRole("button", { name: /re-sync/i }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
    expect(screen.queryByTestId("market-connect-form")).toBeNull();
    expect(
      screen.getByTestId("market-connection-error").textContent,
    ).not.toContain("connect again below");
    await userEvent.click(screen.getByRole("button", { name: /re-sync/i }));
    await waitFor(() => expect(syncMarket).toHaveBeenCalledWith("conn-1"));
  });

  it("says a site with no market has its own catalog, and offers the form", async () => {
    mount(client());

    expect(await screen.findByTestId("market-disconnected")).toBeTruthy();
    expect(screen.getByTestId("market-connect-form")).toBeTruthy();
  });

  it("shows a connected market with its listing count, age and registry", async () => {
    mount(client({ getConnectionStatus: statusFixture({}) as never }));

    const row = await screen.findByTestId("market-connection");

    expect(row.getAttribute("data-status")).toBe("connected");
    expect(row.textContent).toContain("Splicewire Market");
    expect(row.textContent).toContain("2 listings");
    expect(row.textContent).toContain("https://market.example.test/registry");
    // The credential is never projected; the hint is four characters so an operator can tell two
    // credentials apart when re-issuing.
    expect(row.textContent).toContain("key …9f2c");
  });

  it("tells a REFUSED credential apart from an unreachable market", async () => {
    mount(
      client({
        getConnectionStatus: statusFixture({
          status: "refused",
          lastSyncError: "The market refused this connection credential.",
        }) as never,
      }),
    );

    const row = await screen.findByTestId("market-connection");
    expect(row.getAttribute("data-status")).toBe("refused");
    // The refusal carries what to DO about it — a new credential, not a retry.
    expect(screen.getByTestId("market-connection-error").textContent).toMatch(
      /issue a new one/i,
    );
  });

  it("keeps the last good catalog visible when a sync fails, and says why", async () => {
    mount(
      client({
        getConnectionStatus: statusFixture({
          status: "error",
          lastSyncError:
            "Could not reach https://market.example.test: timed out",
          // ⚠️ Still 2. A failed sync does not zero the catalog it last saw — "we could not
          // refresh" is not "there is nothing here".
          listingCount: 2,
        }) as never,
      }),
    );

    const row = await screen.findByTestId("market-connection");
    expect(row.getAttribute("data-status")).toBe("error");
    expect(row.textContent).toContain("2 listings");
    expect(screen.getByTestId("market-connection-error").textContent).toMatch(
      /Could not reach/,
    );
    expect(
      screen.getByTestId("market-connection-error").textContent,
    ).not.toMatch(/issue a new one/i);
  });

  it("sends the URL and credential the operator typed, and nothing else", async () => {
    const connectMarket = vi.fn(async () => connected);
    mount(client({ connectMarket: connectMarket as never }));

    await userEvent.type(
      await screen.findByLabelText("Market URL"),
      "https://market.example.test",
    );
    await userEvent.type(
      screen.getByLabelText("Connection credential"),
      "a-real-credential",
    );
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() =>
      expect(connectMarket).toHaveBeenCalledWith({
        marketUrl: "https://market.example.test",
        credential: "a-real-credential",
      }),
    );
  });

  it("shows a refused credential ON the form, not only in a toast, and clears it on edit", async () => {
    // overnight-ui2 02: a 422 from connect was only a toast, so the refused form showed no refusal at all.
    const refusal = Object.assign(new Error("Request failed with status code 422"), {
      response: { data: { message: "The market refused this connection credential." } },
    });
    const connectMarket = vi.fn(async () => {
      throw refusal;
    });
    mount(client({ connectMarket: connectMarket as never }));

    await userEvent.type(await screen.findByLabelText("Market URL"), "https://market.example.test");
    await userEvent.type(screen.getByLabelText("Connection credential"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));

    const form = screen.getByTestId("market-connect-form");
    const alert = await within(form).findByRole("alert");
    expect(alert.textContent).toContain("The market refused this connection credential.");

    await userEvent.type(screen.getByLabelText("Connection credential"), "x");
    await waitFor(() => expect(within(form).queryByRole("alert")).toBeNull());
  });

  it("reports a failed re-sync as an error even though the call resolved", async () => {
    // ⚠️ The server answers 200 with the connection's NEW state — the operator asked to try
    // again, the host tried, and the row is the answer. A surface that only branched on rejection
    // would report success for a sync that reached nothing.
    const notify = vi.fn();
    mount(
      client({
        getConnectionStatus: statusFixture({}) as never,
        syncMarket: vi.fn(async () => ({
          ...connected,
          status: "error",
          lastSyncError:
            "Could not reach https://market.example.test: timed out",
        })) as never,
      }),
      notify,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: /re-sync/i }),
    );

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        type: "error",
        message: "Could not reach https://market.example.test: timed out",
      }),
    );
  });
});
