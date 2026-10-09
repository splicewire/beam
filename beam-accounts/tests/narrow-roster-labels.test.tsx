import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// TOWER-05 shots-r6 follow-ups (integrator, 2026-10-09):
//  - the stacked team card labelled its role field "role" (the column id), because the column's header is a component;
//    a phone user must read the same "Team role" label the table header shows.
//  - at 390px the tokens header dropped its "N active · N expiring · N archived" summary (hidden below sm).
// `useIsMobile` binds matchMedia at module load, so the narrow-viewport stub is hoisted.
vi.hoisted(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("max-width"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
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

it("labels the stacked team card's role field 'Team role', as the table header does", async () => {
  render(
    <MockTeamProvider>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>
  );

  const invite = await screen.findByTestId("stacked-row-invite");
  expect(within(invite).getByText("Team role", { exact: true })).toBeTruthy();
  expect(within(invite).queryByText("role", { exact: true })).toBeNull();
});

it("keeps the tokens health summary on a narrow screen", async () => {
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

  await screen.findByTestId(`stacked-row-${SAMPLE_TOKENS[0].id}`);
  const summary = screen.getByText(/\d+ active · \d+ expiring ·/);
  // jsdom applies no CSS, so the contract is the class: nothing hides it below the sm breakpoint.
  expect(summary.className.split(/\s+/)).not.toContain("hidden");
});
