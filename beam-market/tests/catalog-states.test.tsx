import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  ExtensionsCatalog,
  ExtensionsProvider,
  type ExtensionsClient,
} from "../src/index";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});

const CONNECTED = {
  connected: true,
  pairingGuidance: {
    connectCommand: "php artisan splicewire:connect",
    manualTokenEnvVar: "SPLICEWIRE_TOKEN",
    manualFallbackHint: "Use a personal access token.",
  },
  markets: [],
};

function client(getCatalog: ExtensionsClient["getCatalog"]): ExtensionsClient {
  const unused = vi.fn(async () => {
    throw new Error("not used");
  });
  return {
    getCatalog,
    getListing: unused,
    getConnectionStatus: vi.fn(async () => CONNECTED),
    getInstalled: vi.fn(async () => []),
    install: unused,
    purchase: unused,
    update: unused,
    remove: vi.fn(async () => undefined),
  } as ExtensionsClient;
}

function mount(c: ExtensionsClient) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ExtensionsProvider services={{ client: c }}>
        <ExtensionsCatalog onSelect={() => {}} />
      </ExtensionsProvider>
    </QueryClientProvider>,
  );
}

describe("ExtensionsCatalog — empty and failed states (VR pass 2)", () => {
  it("says the catalog is empty instead of leaving blank space under the filters", async () => {
    mount(client(vi.fn(async () => ({ listings: [] }))));
    const empty = await screen.findByTestId("catalog-empty");
    expect(empty.textContent).toContain("No extensions are available yet.");
  });

  it("names a filter that matched nothing as a filter miss", async () => {
    mount(client(vi.fn(async () => ({ listings: [] }))));
    await screen.findByTestId("catalog-empty");
    fireEvent.change(screen.getByLabelText("Filter by category"), {
      target: { value: "nothing" },
    });
    await waitFor(() =>
      expect(screen.getByTestId("catalog-empty").textContent).toContain(
        "No extensions match these filters.",
      ),
    );
  });

  it("offers a Retry on failure that re-runs the catalog query", async () => {
    const getCatalog = vi
      .fn<ExtensionsClient["getCatalog"]>()
      .mockRejectedValueOnce(new Error("Catalog unavailable"))
      .mockResolvedValue({ listings: [] });
    mount(client(getCatalog));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not load extensions.");
    fireEvent.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("catalog-empty")).toBeTruthy();
    expect(getCatalog).toHaveBeenCalledTimes(2);
  });
});
