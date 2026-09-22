// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FrameConsole from "../pages/frame/console";
import { resourceFiltersFixture } from "./resource-filters.fixture";

vi.mock("@inertiajs/react", () => ({
  Head: () => null,
  usePage: () => ({ props: {} }),
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
  router: { visit: vi.fn() },
}));
let client: QueryClient;
beforeEach(() => {
  window.history.replaceState({}, "", "/files");
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});
function mount(fixture = resourceFiltersFixture()) {
  vi.stubGlobal("fetch", fixture.fetch);
  const view = render(
    <QueryClientProvider client={client}>
      <FrameConsole />
    </QueryClientProvider>
  );
  return { ...view, fixture };
}
async function filterModified() {
  fireEvent.click(await screen.findByRole("button", { name: "Filter" }));
  fireEvent.click(await screen.findByRole("button", { name: "State" }));
  fireEvent.change(await screen.findByPlaceholderText("Value…"), {
    target: { value: "modified" },
  });
  await waitFor(() => expect(screen.queryByText("Landing page")).toBeNull());
  expect(await screen.findByText("Release notes")).toBeTruthy();
}
describe("manifest console resource capabilities", () => {
  it("renders declared filters, executes them and preserves a saved view across remounts", async () => {
    const { fixture, unmount } = mount();
    await screen.findByText("Landing page");
    // Closed popovers must not leak their controls before the user opens them.
    expect(screen.queryByRole("button", { name: "State" })).toBeNull();
    await filterModified();
    expect(
      new URLSearchParams(window.location.search).get("filter[state]")
    ).toBe("modified");
    expect(
      fixture.requests.some(
        ({ url }) =>
          new URL(url, "https://console.example").searchParams.get(
            "filter[state]"
          ) === "modified"
      )
    ).toBe(true);
    expect(screen.getByRole("combobox", { name: "Sort by" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save current view" }));
    fireEvent.change(screen.getByPlaceholderText("View name"), {
      target: { value: "Modified files" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm save" }));
    await screen.findByRole("button", { name: "Modified files" });
    expect(
      fixture.requests.find(({ method }) => method === "POST")?.body
    ).toMatchObject({
      resource: "files",
      name: "Modified files",
      query_parameters: { filter: { state: "modified" } },
    });
    unmount();
    client.clear();
    window.history.replaceState({}, "", "/files");
    mount(fixture);
    await screen.findByText("Landing page");
    fireEvent.click(
      await screen.findByRole("button", { name: "Modified files" })
    );
    await waitFor(() => expect(screen.queryByText("Landing page")).toBeNull());
    expect(await screen.findByText("Release notes")).toBeTruthy();
  });
  it("keeps declared filtering usable when saved-view creation is denied", async () => {
    mount(resourceFiltersFixture({ writable: false }));
    await screen.findByText("Landing page");
    await filterModified();
    expect(
      screen.queryByRole("button", { name: "Save current view" })
    ).toBeNull();
  });
  it("omits controls and saved-view requests when the resource declares no capability", async () => {
    const { fixture } = mount(resourceFiltersFixture({ capabilities: false }));
    await screen.findByText("Landing page");
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Save current view" })
    ).toBeNull();
    expect(
      fixture.requests.some(({ url }) => url.includes("saved-filters"))
    ).toBe(false);
  });
});
