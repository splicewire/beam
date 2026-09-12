import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userEvent, within, expect } from "storybook/test";
import { ExtensionsArea } from "./ExtensionsArea";
import { ExtensionsProvider, type ExtensionsClient } from "./provider";
import type { MarketExtension, InstalledExtension } from "./types";
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
  priceLabel: null,
  sellerName: "Example publisher",
  installCount: 10,
  description: "A reusable team handbook.",
  changelog: [],
  createdAt: "2026-09-01T00:00:00Z",
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
function Stage({
  state = "populated",
  gated = false,
}: {
  state?: "populated" | "empty" | "disconnected" | "error" | "loading";
  gated?: boolean;
}) {
  const [cache] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const activeListing: MarketExtension = gated
    ? { ...listing, requiresSplicewire: true }
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
    }),
    getInstalled: async () => (state === "empty" ? [] : [installed]),
    install: async () => installed,
    update: async () => ({ ...installed, updateAvailable: false }),
    remove: async () => undefined,
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
