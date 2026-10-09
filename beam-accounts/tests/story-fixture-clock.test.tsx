import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokensRoster } from "../src/tokens-roster";
import { TokensProvider } from "../src/provider";
import { makeTokensClient, rosterTokens } from "../src/story-harness";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// The roster prints "Last used" as "Nd ago" from Date.now(). A fixture with fixed dates made the
// TokensRoster baselines tick over every day at 21:00Z (launch ticket 05, slice 10). The expiry date counts
// too: a token within 14 days of expiresAt is "expiring", and one past it reads "Expired".
it.each([
  "2026-10-03T20:58:00Z",
  "2026-10-04T21:30:00Z",
  "2026-12-20T12:00:00Z",
  "2027-01-02T12:00:00Z",
  "2027-03-01T00:00:00Z",
])(
  "the roster story reads the same on %s: 'Last used' ages, nothing expiring, nothing expired",
  async (now) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TokensProvider services={{ client: makeTokensClient({ tokens: rosterTokens() }) }}>
          <TokensRoster />
        </TokensProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("71d ago")).toBeTruthy();
    expect(screen.getByText("94d ago")).toBeTruthy();
    expect(screen.getByText(/0 expiring/)).toBeTruthy();
    expect(screen.queryByText(/^Expired /)).toBeNull();
  },
);
