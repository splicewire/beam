import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokensRoster } from "../src/tokens-roster";
import { TokensProvider } from "../src/provider";
import { makeTokensClient, SAMPLE_TOKENS } from "../src/story-harness";
import type { ApiTokenData, TokensServices } from "../src/types";
afterEach(cleanup);
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});
function mount(services: TokensServices) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TokensProvider services={services}>
        <TokensRoster />
      </TokensProvider>
    </QueryClientProvider>,
  );
}
it("renders the promoted roster and sends archive to the injected transport", async () => {
  const client = makeTokensClient();
  client.archive = vi.fn(async () => {});
  const notify = vi.fn();
  mount({
    client,
    notify,
    renderTokenActivity: (token) => <button>Activity {token.name}</button>,
  });
  expect(await screen.findByText("CI deploys")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Activity CI deploys" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Archive CI deploys" }));
  await waitFor(() => expect(client.archive).toHaveBeenCalledWith(SAMPLE_TOKENS[0].id));
  await waitFor(() =>
    expect(notify).toHaveBeenCalledWith({
      type: "success",
      message: "Archived “CI deploys”.",
    }),
  );
});
it("preserves service provenance instead of treating a machine token as an API token", async () => {
  const token: ApiTokenData = {
    ...SAMPLE_TOKENS[0],
    id: 'e3b0c442-98fc-4c14-9afb-f4c8996fb090',
    name: "Sync machine",
    provenance: "service",
  };
  mount({ client: makeTokensClient({ tokens: [token] }) });
  await screen.findByText("No tokens match the selected types.");
  fireEvent.click(screen.getByRole("button", { name: "API 0" }));
  expect(await screen.findByText("Sync machine")).toBeTruthy();
  expect(screen.getByText("Service")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Rotate" })).toBeNull();
});
it("reveals a rotated secret through the injected client", async () => {
  const client = makeTokensClient({ tokens: [SAMPLE_TOKENS[0]] });
  client.rotate = vi.fn(async () => ({
    id: 'e3b0c442-98fc-4c14-9afb-f4c8996fb091',
    name: "CI deploys",
    token: "fixture-rotated-secret",
  }));
  mount({ client });
  await screen.findByText("CI deploys");
  fireEvent.click(screen.getByRole("button", { name: "Rotate" }));
  expect(await screen.findByText("fixture-rotated-secret")).toBeTruthy();
  expect(client.rotate).toHaveBeenCalledWith({ id: SAMPLE_TOKENS[0].id });
});
it("caps the Name column so a long session name truncates instead of pushing every other column out of view", async () => {
  // A browser session's name is its whole user-agent string. With only `truncate` and no width cap, the
  // auto-layout table grew the Name column to the full string and scrolled every other column away
  // (launch ticket 00, overnight-ui2 06).
  mount({ client: makeTokensClient(), notify: vi.fn() });
  const name = await screen.findByText("CI deploys");
  expect(name.className).toContain("truncate");
  expect(name.closest("div.space-y-0\\.5")?.className).toMatch(/\bmax-w-\[/);
});
it("wraps a revealed secret inside the dialog instead of widening it past its right edge", async () => {
  // DialogContent is a `grid`; its implicit track sizes to the items' min-content. A `truncate`
  // (nowrap) key made that the whole secret, so the key box, the notice and Done were clipped at
  // the dialog's right edge (replay-6 G3-BEAM-TOKENS). jsdom has no layout, so pin the classes.
  const client = makeTokensClient({ tokens: [SAMPLE_TOKENS[0]] });
  client.rotate = vi.fn(async () => ({
    id: 'e3b0c442-98fc-4c14-9afb-f4c8996fb092',
    name: "CI deploys",
    token: "27|0kanidkPQLdb4KeSh34yHR98HSdifY4iPd8VL9eu2856b0ac",
  }));
  mount({ client });
  await screen.findByText("CI deploys");
  fireEvent.click(screen.getByRole("button", { name: "Rotate" }));
  const key = await screen.findByText(
    "27|0kanidkPQLdb4KeSh34yHR98HSdifY4iPd8VL9eu2856b0ac",
  );
  expect(key.className).toMatch(/\bbreak-all\b/);
  expect(key.className).toMatch(/\bmin-w-0\b/);
  expect(key.className).not.toMatch(/\btruncate\b/);
  expect(key.parentElement?.parentElement?.className).toMatch(/\bmin-w-0\b/);
});
it("subtitles a row with its expiry, never the server's PersonalAccessToken#<id> class name", async () => {
  mount({ client: makeTokensClient(), notify: vi.fn() });
  await screen.findByText("CI deploys");
  expect(screen.queryByText(/PersonalAccessToken#/)).toBeNull();
  expect(
    screen.getByText(new RegExp(`^Expire[sd] ${new Date("2026-12-31T00:00:00Z").toLocaleDateString()}$`)),
  ).toBeTruthy();
  expect(screen.getAllByText("Never expires").length).toBeGreaterThan(0);
});
it("labels a past expiry as expired", async () => {
  const { expiryLabel } = await import("../src/tokens-roster");
  const now = Date.parse("2026-06-01T00:00:00Z");
  expect(expiryLabel({ expires_at: null }, now)).toBe("Never expires");
  expect(expiryLabel({ expires_at: "2026-01-01T00:00:00Z" }, now)).toMatch(/^Expired /);
  expect(expiryLabel({ expires_at: "2026-12-31T00:00:00Z" }, now)).toMatch(/^Expires /);
});
