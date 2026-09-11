import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
};
function Stage({
  state = "populated",
}: {
  state?: "populated" | "empty" | "disconnected" | "error" | "loading";
}) {
  const [cache] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const client: ExtensionsClient = {
    getCatalog: async () => {
      if (state === "error") throw new Error("Catalog unavailable");
      if (state === "loading") return new Promise(() => {});
      return { listings: state === "empty" ? [] : [listing] };
    },
    getListing: async () => listing,
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
