import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// TOWER-05 shots-r5 (integrator, 2026-10-09): at 390px the tokens and team tables pushed Rotate/Archive,
// resend/cancel and Status off-screen into a sideways scroller, so the pending -> active flip was invisible
// on a phone. Below the shared 768px breakpoint each roster row must render as a stacked card that carries
// its status and its actions. `useIsMobile` binds matchMedia at module load, so the stub is hoisted.
const viewport = vi.hoisted(() => {
  const state = { narrow: true };
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("max-width") ? state.narrow : false;
    },
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return state;
});
vi.mock("@schemastud/seam", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@schemastud/seam")>()),
  SchemaForm: () => null,
}));
import { TokensRoster } from "../src/tokens-roster";
import { TokensProvider } from "../src/provider";
import { makeTokensClient, SAMPLE_TOKENS } from "../src/story-harness";
import { TeamPage } from "../src/team-page";
import { MockTeamProvider } from "../src/team-story-harness";

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

it("stacks each token as a card carrying its dates and its Rotate/Archive actions on a narrow screen", async () => {
  viewport.narrow = true;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TokensProvider
        services={{ client: makeTokensClient({ tokens: [SAMPLE_TOKENS[0]] }) }}
      >
        <TokensRoster />
      </TokensProvider>
    </QueryClientProvider>
  );

  const card = await screen.findByTestId(`stacked-row-${SAMPLE_TOKENS[0].id}`);
  expect(screen.queryByRole("table")).toBeNull();
  expect(within(card).getByText(SAMPLE_TOKENS[0].name)).toBeTruthy();
  expect(within(card).getByText("Last used")).toBeTruthy();
  expect(within(card).getByText("Created")).toBeTruthy();
  expect(within(card).getByRole("button", { name: /Rotate/ })).toBeTruthy();
  expect(
    within(card).getByRole("button", {
      name: `Archive ${SAMPLE_TOKENS[0].name}`,
    })
  ).toBeTruthy();
});

it("stacks each member and invitation as a card carrying its Status and its resend action on a narrow screen", async () => {
  viewport.narrow = true;
  render(
    <MockTeamProvider>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>
  );

  const invite = await screen.findByTestId("stacked-row-invite");
  expect(screen.queryByRole("table")).toBeNull();
  expect(within(invite).getByText("Status")).toBeTruthy();
  expect(within(invite).getByText(/pending/i)).toBeTruthy();
  expect(within(invite).getByTitle("Resend invitation")).toBeTruthy();
});

it("keeps the wide table on a desktop screen", async () => {
  viewport.narrow = false;
  render(
    <MockTeamProvider>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>
  );

  expect(await screen.findByRole("table")).toBeTruthy();
  expect(screen.queryByTestId("stacked-row-invite")).toBeNull();
});
