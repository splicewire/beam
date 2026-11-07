import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TokensRoster } from "../src/tokens-roster";
import { TokensPage } from "../src/tokens-page";
import { TokensProvider } from "../src/provider";
import { tokenFragment } from "../src/token-fragment";
import { makeTokensClient, SAMPLE_TOKENS } from "../src/story-harness";
import type { ApiTokenData } from "../src/types";

// owner-review-20261102 K-28: "can we show a last 4 or something on the api tokens so they're easier to
// identify?" A token minted after the change carries `lastFour`; one minted before it has only its id,
// whose tail is part of the `{id}|{secret}` string its holder has.

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

const twin = (id: string, lastFour: string | null): ApiTokenData => ({
  ...SAMPLE_TOKENS[0],
  id,
  name: "dev-login-as",
  lastFour,
});

const minted = twin("0f1e2d3c-4b5a-4697-8899-aabbccdd3f9a", "c41e");
const legacy = twin("0f1e2d3c-4b5a-4697-8899-aabbccdd6fa8", null);

function mount(ui: "roster" | "page", tokens: ApiTokenData[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TokensProvider services={{ client: makeTokensClient({ tokens }) }}>
        {ui === "roster" ? <TokensRoster /> : <TokensPage />}
      </TokensProvider>
    </QueryClientProvider>
  );
}

describe("tokenFragment", () => {
  it("shows the stored last four of the secret", () => {
    expect(tokenFragment(minted)).toEqual({
      kind: "secret",
      text: "…c41e",
      label: "Token ends in c41e",
    });
  });

  it("falls back to the id tail, labelled as the id, for a token minted before last-four capture", () => {
    expect(tokenFragment(legacy)).toEqual({
      kind: "id",
      text: "id …6fa8",
      label: "Token id ends in 6fa8",
    });
  });

  it("shows a short id whole rather than eliding nothing", () => {
    // The package's default token model is bigint-keyed, so a host can hand the roster `17`.
    expect(tokenFragment({ id: "17", lastFour: null }).text).toBe("id 17");
  });

  it("treats an empty last four like a missing one", () => {
    expect(tokenFragment({ ...minted, lastFour: "" }).kind).toBe("id");
  });
});

describe.each(["roster", "page"] as const)("the %s", (ui) => {
  it("tells two same-named tokens apart by their fragments", async () => {
    mount(ui, [minted, legacy]);

    await screen.findAllByText("dev-login-as");
    // jsdom renders the table and the stacked mobile cards both, so a fragment can appear twice.
    expect(screen.getAllByText("…c41e").length).toBeGreaterThan(0);
    expect(screen.getAllByText("id …6fa8").length).toBeGreaterThan(0);
  });

  it("names the fragment for a screen reader, not as an ellipsis", async () => {
    mount(ui, [minted]);

    const fragment = (await screen.findAllByText("…c41e"))[0];
    const holder = fragment.closest("[data-token-fragment]") as HTMLElement;
    expect(holder).toBeTruthy();
    expect(holder.getAttribute("title")).toBe("Token ends in c41e");
    expect(within(holder).getByText("Token ends in c41e").className).toContain("sr-only");
    expect(fragment.getAttribute("aria-hidden")).toBe("true");
  });
});
