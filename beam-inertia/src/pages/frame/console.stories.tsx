import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { useEffect, useState } from "react";
import { resourceFiltersFixture } from "../../frame/resource-filters.fixture";
import { setStubPage } from "../../story-harness";
import FrameConsole from "./console";

type StageProps = {
  capabilities?: boolean;
  writable?: boolean;
  empty?: boolean;
  state?: "ready" | "loading" | "error";
};

/** Actual console with a disposable HTTP boundary; no Laravel session or database. */
function ConsoleStage(props: StageProps) {
  const [client, setClient] = useState<QueryClient | null>(null);
  useEffect(() => {
    const originalFetch = globalThis.fetch;
    const originalUrl = window.location.href;
    const fixture = resourceFiltersFixture({
      ...props,
      path: window.location.pathname.replace(/^\//, ""),
    });
    const fetch: typeof globalThis.fetch = (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : input.url;
      return url.startsWith("/frame/")
        ? fixture.fetch(input, init)
        : originalFetch(input, init);
    };
    globalThis.fetch = fetch;
    setStubPage({});
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    setClient(queryClient);
    return () => {
      queryClient.clear();
      if (globalThis.fetch === fetch) globalThis.fetch = originalFetch;
      window.history.replaceState(window.history.state, "", originalUrl);
    };
  }, [props.capabilities, props.writable, props.empty, props.state]);
  return client ? (
    <QueryClientProvider client={client}>
      <FrameConsole />
    </QueryClientProvider>
  ) : null;
}

const meta = {
  title: "Inertia/Frame/Console",
  component: ConsoleStage,
  parameters: { layout: "fullscreen" },
  args: { capabilities: true, writable: true, empty: false, state: "ready" },
} satisfies Meta<typeof ConsoleStage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FiltersAndSavedViews: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Landing page")).toBeInTheDocument();
    await expect(
      await canvas.findByRole("button", { name: "Filter" })
    ).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Save current view" })
    ).toBeVisible();
  },
};
export const Dark: Story = {
  globals: { colorScheme: "dark" },
  play: FiltersAndSavedViews.play,
};
export const ReadOnlyViews: Story = {
  args: { writable: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Landing page")).toBeVisible();
    await expect(await canvas.findByText("Saved views")).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Filter" })
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Save current view" })
    ).not.toBeInTheDocument();
  },
};
export const NoCapabilities: Story = {
  args: { capabilities: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Landing page")).toBeVisible();
    await expect(await canvas.findByText("Release notes")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Filter" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Save current view" })
    ).not.toBeInTheDocument();
  },
};
export const Empty: Story = {
  args: { empty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No records.")).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Filter" })
    ).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Save current view" })
    ).toBeVisible();
  },
};
export const Loading: Story = {
  args: { state: "loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Loading the frame manifest…")
    ).toBeVisible();
    await expect(canvas.queryByText("Landing page")).not.toBeInTheDocument();
  },
};
export const Error: Story = {
  args: { state: "error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", {
        name: "The frame manifest did not load",
      })
    ).toBeVisible();
    await expect(
      await canvas.findByText("GET /frame/manifest failed (503).")
    ).toBeVisible();
    await expect(canvas.queryByText("Landing page")).not.toBeInTheDocument();
  },
};
export const NarrowViewport: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: FiltersAndSavedViews.play,
};
