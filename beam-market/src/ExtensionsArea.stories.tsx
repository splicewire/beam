import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userEvent, within, expect } from "storybook/test";
import { ExtensionsArea } from "./ExtensionsArea";
import { ExtensionsProvider, type ExtensionsClient } from "./provider";
import type {
  InstalledExtension,
  MarketConnection,
  MarketEntitlement,
  MarketExtension,
} from "./types";
const listing: MarketExtension = {
  id: 1,
  name: "Team handbook",
  kind: "scaffold_pack",
  categories: ["Documentation"],
  trustTier: "Official",
  requiresSplicewire: false,
  isPlatformTier: false,
  isInstalled: false,
  isFree: true,
  isEntitled: true,
  priceLabel: null,
  sellerName: "Example publisher",
  installCount: 10,
  description: "A reusable team handbook.",
  changelog: [],
  createdAt: "2026-09-01T00:00:00Z",
  // ux-demo-convergence G5 — no provenance: a listing this host published itself.
  marketName: null,
  syncedAt: null,
};
const installed: InstalledExtension = {
  installId: "installed-uuid",
  productId: 1,
  name: listing.name,
  kind: listing.kind,
  trustTier: listing.trustTier,
  isPlatformTier: false,
  installedAt: "2026-09-01T00:00:00Z",
  installedVersion: "1.0.0",
  latestVersion: "1.1.0",
  updateAvailable: true,
  entitlement: null,
  deployment: {
    state: "detected",
    package: "splicewire/beam-extension-demo",
    requestedVersion: "1.0.0",
    detectedVersion: "1.0.0",
    lastVerifiedVersion: "1.0.0",
    lastVerifiedAt: "2026-09-01T00:00:00Z",
    instructions: [],
    error: null,
  },
};
/**
 * ux-demo-convergence G5 — the paid-listing states. A $19.00 listing is the same row with a price,
 * `isEntitled` false until a purchase captures, and the entitlement (with its registry credential)
 * once it has.
 */
const paidListing: MarketExtension = {
  ...listing,
  id: 2,
  name: "Waveform pro",
  kind: "beam_extension",
  isFree: false,
  isEntitled: false,
  priceLabel: "$19.00",
  description: "A paid Beam Extension.",
};

const entitlement: MarketEntitlement = {
  entitlementId: "entitlement-uuid",
  productId: paidListing.id,
  status: "active",
  grantedAt: "2026-09-12T00:00:00Z",
  amountLabel: "$19.00",
  paymentRef: "fake_ch_1a2b3c",
  licenseId: "lic_01ab",
  licenseKey: "LIC-DEMO-KEY-0000-0000",
  registryUsername: "composer",
  registryUrl: "https://app.example.test/registry",
};

/** The paid listing after a purchase: bought, credential delivered, and installed. */
const paidInstalled: InstalledExtension = {
  ...installed,
  installId: "installed-paid-uuid",
  productId: paidListing.id,
  name: paidListing.name,
  kind: paidListing.kind,
  entitlement,
  deployment: {
    ...installed.deployment,
    state: "instructed",
    detectedVersion: null,
    instructions: ["composer require acme/waveform-pro:1.0.0"],
  },
};

/**
 * ux-demo-convergence G5 (G5-CATALOG-FEDERATION) — the four connection states, as four fixtures.
 * They exist separately because they are four different SCREENS: a site with no market, one that
 * is current, one whose credential the market refused, and one that could not reach its market.
 * The last two are the pair JOURNEYS §G5 forbids collapsing.
 */
const connectedMarket: MarketConnection = {
  id: "connection-uuid",
  marketUrl: "https://market.example.test",
  marketName: "Splicewire Market",
  status: "connected",
  registryUrl: "https://market.example.test/registry",
  registryUsername: "composer",
  lastSyncedAt: "2026-09-12T12:00:00Z",
  lastSyncError: null,
  listingCount: 1,
  credentialHint: "9f2c",
  createdAt: "2026-09-12T11:00:00Z",
};

const refusedMarket: MarketConnection = {
  ...connectedMarket,
  status: "refused",
  lastSyncError:
    "The market refused this connection credential. Reconnect with a credential issued by https://market.example.test.",
};

const unreachableMarket: MarketConnection = {
  ...connectedMarket,
  status: "error",
  lastSyncError:
    "Could not reach https://market.example.test: cURL error 28: Operation timed out",
};

/** A catalog row that came FROM a market — the provenance line a locally-published row has not. */
const federatedListing: MarketExtension = {
  ...listing,
  id: 3,
  name: "Demo Notes",
  kind: "beam_extension",
  sellerName: "Splicewire",
  marketName: "Splicewire Market",
  syncedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
};

function marketsFor(state: StageState): MarketConnection[] {
  if (state === "federated") return [connectedMarket];
  if (state === "market-refused") return [refusedMarket];
  if (state === "market-unreachable") return [unreachableMarket];

  return [];
}

type StageState =
  | "populated"
  | "empty"
  | "disconnected"
  | "error"
  | "loading"
  // Paid, not entitled — the Buy control is the acquisition path.
  | "paid"
  // Paid, purchase rejected by the payment rail — failure + retry on the surface.
  | "paid-declined"
  // Paid, bought, installed — the credential the deploy step needs.
  | "entitled"
  // ux-demo-convergence G5 — connected to a market: the catalog is the market's, with provenance.
  | "federated"
  // Connected, credential revoked at the market — reconnect, not retry.
  | "market-refused"
  // Connected, market unreachable — the last good catalog still renders, stamped with its age.
  | "market-unreachable";

function Stage({
  state = "populated",
  gated = false,
}: {
  state?: StageState;
  gated?: boolean;
}) {
  const [cache] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const paidStates: StageState[] = ["paid", "paid-declined", "entitled"];
  const paid = paidStates.includes(state);
  const federatedStates: StageState[] = [
    "federated",
    "market-refused",
    "market-unreachable",
  ];
  const activeListing: MarketExtension = federatedStates.includes(state)
    ? federatedListing
    : gated
    ? { ...listing, requiresSplicewire: true }
    : paid
      ? state === "entitled"
        ? { ...paidListing, isEntitled: true, isInstalled: true }
        : paidListing
      : listing;
  const client: ExtensionsClient = {
    getCatalog: async () => {
      if (state === "error") throw new Error("Catalog unavailable");
      if (state === "loading") return new Promise(() => {});
      return { listings: state === "empty" ? [] : [activeListing] };
    },
    getListing: async () => activeListing,
    getConnectionStatus: async () => ({
      connected: state !== "disconnected",
      pairingGuidance: {
        connectCommand: "php artisan splicewire:connect",
        manualTokenEnvVar: "SPLICEWIRE_TOKEN",
        manualFallbackHint: "Use a personal access token.",
      },
      // ⚠️ A DIFFERENT fact from `connected` above, on the same endpoint. `connected` is the
      // Splicewire antenna; this is where the catalog comes from. See ConnectionStatusData.
      markets: marketsFor(state),
    }),
    getInstalled: async () =>
      state === "empty"
        ? []
        : state === "entitled"
          ? [paidInstalled]
          : [installed],
    install: async () => installed,
    purchase: async () => {
      // The declined path rejects the way the server does (402 with the rail's own code), so the
      // story exercises the SAME branch the real client takes — never a story-only failure flag.
      if (state === "paid-declined") {
        throw {
          response: {
            data: {
              message:
                "The payment was not completed (failed: card_declined). Nothing was purchased.",
            },
          },
        };
      }
      return { productId: paidListing.id, alreadyEntitled: false, entitlement };
    },
    update: async () => ({ ...installed, updateAvailable: false }),
    remove: async () => undefined,
    connectMarket: async () => connectedMarket,
    syncMarket: async () => connectedMarket,
    disconnectMarket: async () => undefined,
  };
  return (
    <QueryClientProvider client={cache}>
      <ExtensionsProvider services={{ client }}>
        <ExtensionsArea />
      </ExtensionsProvider>
    </QueryClientProvider>
  );
}
const meta = {
  title: "Market/ExtensionsArea",
  component: ExtensionsArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ExtensionsArea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = { render: () => <Stage /> };
export const Empty: Story = { render: () => <Stage state="empty" /> };
export const Disconnected: Story = {
  render: () => <Stage state="disconnected" />,
};
export const Failed: Story = { render: () => <Stage state="error" /> };
export const Loading: Story = { render: () => <Stage state="loading" /> };

/**
 * Update available — the fixture `installed` row already carries `updateAvailable: true` +
 * a newer `latestVersion`; `play` switches to the Installed tab (populated's default
 * Browse tab never shows it) so VR captures the "v1.1.0 available" label + Update button.
 */
export const UpdateAvailable: Story = {
  render: () => <Stage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Installed" }));
    await expect(await canvas.findByText(/v1\.1\.0 available/i)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /update/i })).toBeInTheDocument();
  },
};

/** Paid, not entitled: the catalog card shows the price and the sheet offers Buy, never Install. */
export const PaidNotEntitled: Story = {
  render: () => <Stage state="paid" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Waveform pro"));
    const sheet = within(document.body);
    await expect(await sheet.findByRole("button", { name: "Buy $19.00" })).toBeInTheDocument();
  },
};

/** Purchasing: the Buy control is pending while the checkout is in flight. */
export const Purchasing: Story = {
  render: () => <Stage state="paid" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Waveform pro"));
    const sheet = within(document.body);
    await userEvent.click(await sheet.findByRole("button", { name: "Buy $19.00" }));
    await expect(await sheet.findByText(/purchased|purchasing/i)).toBeInTheDocument();
  },
};

/** Purchase failed: the rail's own decline text, and a retry, on the surface. */
export const PurchaseFailed: Story = {
  render: () => <Stage state="paid-declined" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Waveform pro"));
    const sheet = within(document.body);
    await userEvent.click(await sheet.findByRole("button", { name: "Buy $19.00" }));
    await expect(await sheet.findByRole("alert")).toHaveTextContent(/card_declined/i);
    await expect(await sheet.findByRole("button", { name: "Try again" })).toBeInTheDocument();
  },
};

/** Entitled: the Installed tab carries the licence and the deploy commands it makes runnable. */
export const Entitled: Story = {
  render: () => <Stage state="entitled" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Installed" }));
    await expect(await canvas.findByText("Your licence · $19.00")).toBeInTheDocument();
    await userEvent.click(await canvas.findByRole("button", { name: "Show key" }));
    await expect(await canvas.findByText("LIC-DEMO-KEY-0000-0000")).toBeInTheDocument();
  },
};

/**
 * Deployment pending / instructions — a listing that `requiresSplicewire`, disconnected:
 * `play` opens its detail sheet so VR captures the gated-and-disconnected pairing guidance
 * (the `connectCommand` + manual-token fallback a host walks an operator through).
 */
export const DeploymentInstructions: Story = {
  render: () => <Stage state="disconnected" gated />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Requires Splicewire"));
    const sheet = within(document.body);
    await expect(await sheet.findByText(/requires a connected splicewire account/i)).toBeInTheDocument();
    await expect(await sheet.findByText("php artisan splicewire:connect")).toBeInTheDocument();
  },
};

/**
 * Connected to a market: the catalog is the market's, and every card says so.
 */
export const FederatedCatalog: Story = {
  render: () => <Stage state="federated" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId("listing-provenance"),
    ).toHaveTextContent(/From Splicewire Market/);
  },
};

/** The connection screen itself, connected and current. */
export const MarketConnected: Story = {
  render: () => <Stage state="federated" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Market" }));
    const row = await canvas.findByTestId("market-connection");
    await expect(row).toHaveAttribute("data-status", "connected");
    await expect(row).toHaveTextContent(/1 listing/);
    await expect(
      await canvas.findByRole("button", { name: /re-sync/i }),
    ).toBeInTheDocument();
  },
};

/** No market: the honest empty state, with the connect form under it. */
export const MarketDisconnected: Story = {
  render: () => <Stage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Market" }));
    await expect(
      await canvas.findByTestId("market-disconnected"),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByTestId("market-connect-form"),
    ).toBeInTheDocument();
  },
};

/**
 * Credential refused — distinct from unreachable, and the message says what to do about it.
 */
export const MarketCredentialRefused: Story = {
  render: () => <Stage state="market-refused" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Market" }));
    await expect(await canvas.findByTestId("market-connection")).toHaveAttribute(
      "data-status",
      "refused",
    );
    await expect(
      await canvas.findByTestId("market-connection-error"),
    ).toHaveTextContent(/issue a new one/i);
  },
};

/** Sync failed — the last good catalog still renders, and the row says how old it is. */
export const MarketSyncFailed: Story = {
  render: () => <Stage state="market-unreachable" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Market" }));
    await expect(await canvas.findByTestId("market-connection")).toHaveAttribute(
      "data-status",
      "error",
    );
    await expect(
      await canvas.findByTestId("market-connection-error"),
    ).toHaveTextContent(/Could not reach/i);
    // The catalog it last saw is still there — "sync failed" is not "catalog empty".
    await userEvent.click(await canvas.findByRole("button", { name: "Browse" }));
    await expect(await canvas.findByText("Demo Notes")).toBeInTheDocument();
  },
};
