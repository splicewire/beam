import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { router } from "@inertiajs/react";
import { KNOWN_CONTEXTS } from "@schemastud/frame";
import { expect, within, userEvent } from "storybook/test";
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
      await canvas.findByRole("button", { name: "Filter" }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Save current view" }),
    ).toBeVisible();
  },
};
export const ReadOnlyViews: Story = {
  args: { writable: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Landing page")).toBeVisible();
    await expect(await canvas.findByText("Saved views")).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Filter" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Save current view" }),
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
      canvas.queryByRole("button", { name: "Filter" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Save current view" }),
    ).not.toBeInTheDocument();
  },
};
export const Empty: Story = {
  args: { empty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No records.")).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Filter" }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "Save current view" }),
    ).toBeVisible();
  },
};
export const Loading: Story = {
  args: { state: "loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Loading the console…")).toBeVisible();
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
      }),
    ).toBeVisible();
    await expect(
      await canvas.findByText("GET /frame/manifest failed (503)."),
    ).toBeVisible();
    await expect(canvas.queryByText("Landing page")).not.toBeInTheDocument();
  },
};
export const NarrowViewport: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: FiltersAndSavedViews.play,
};

/** The real console/router/create form; only HTTP and Inertia's host visit are fixtures. */
function CreateJourneyStage() {
  const [client, setClient] = useState<QueryClient | null>(null);
  useEffect(() => {
    const originalFetch = globalThis.fetch;
    const originalVisit = router.visit;
    const originalUrl = window.location.href;
    let created: { id: string; title: string } | null = null;
    const manifest = {
      resources: [
        {
          key: "requests",
          creatable: true,
          editable: false,
          deletable: false,
          showable: true,
          form: "bare",
          nav: { label: "Service requests" },
        },
      ],
      contexts: {
        requests: {
          byNode: {
            title: { "list-column": { participates: true, label: "Title" } },
          },
          inherits: {},
          known: KNOWN_CONTEXTS,
          singularLabel: "service request",
          createAffordance: "frame",
          can: { create: true, update: false, delete: false },
        },
      },
      nav: { items: [] },
      routeContext: [
        { routeName: "requests.index", path: "requests", mounts: "list" },
        { routeName: "requests.create", path: "requests/new", mounts: "edit" },
      ].map((entry) => ({
        ...entry,
        resource: "requests",
        shell: "app",
        guard: null,
        lazy: false,
      })),
    };
    globalThis.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (!url.startsWith("/frame/")) return originalFetch(input, init);
      if (url === "/frame/manifest") return Response.json(manifest);
      if (url.endsWith("/schema") && !url.includes("/filters/"))
        return Response.json({
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", title: "Title", minLength: 1 },
          },
        });
      if (url.includes("/filters/"))
        return Response.json({ data: { type: "object", properties: {} } });
      if (init?.method === "POST") {
        created = { id: "request-1", ...JSON.parse(String(init.body)) };
        return Response.json({ data: created });
      }
      return Response.json({
        data: created ? [created] : [],
        total: created ? 1 : 0,
        page: 1,
        perPage: 25,
      });
    };
    router.visit = (href) => {
      window.history.pushState({}, "", String(href));
      window.dispatchEvent(new PopStateEvent("popstate"));
    };
    window.history.replaceState({}, "", "/requests/new");
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
      globalThis.fetch = originalFetch;
      router.visit = originalVisit;
      window.history.replaceState({}, "", originalUrl);
    };
  }, []);
  return client ? (
    <QueryClientProvider client={client}>
      <FrameConsole />
    </QueryClientProvider>
  ) : null;
}

export const CreateReturnsToList: Story = {
  render: () => <CreateJourneyStage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByRole("textbox", { name: /^Title/ });
    await userEvent.type(title, "Replace broken monitor");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(
      await canvas.findByText("Replace broken monitor"),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "New service request" }),
    ).toBeVisible();
    await expect(window.location.pathname).toBe("/requests");
  },
};
