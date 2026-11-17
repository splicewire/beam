import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ClientCatalog } from "@schemastud/messages";
import { MessageProvider } from "@schemastud/messages/react";
import { TokensPage } from "../src/tokens-page";
import { TokensProvider } from "../src/provider";
import { makeTokensClient, SAMPLE_TOKENS } from "../src/story-harness";

// Localization 29 (REVIEW-29A1amend-A2 NIT 3): the tokens page's own TABLE re-renders in the new locale on a live
// switch: its memoized columns depend on the reader's messages.
afterEach(cleanup);
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const english: ClientCatalog = { version: 1, locale: "en", realm: null, direction: "ltr", messages: {} };
const spanish: ClientCatalog = {
  version: 1,
  locale: "es",
  realm: null,
  direction: "ltr",
  messages: { "splicewire-beam-accounts::messages.tokens_col_last_used": { text: "Último uso", sourceLocale: "es" } },
};

it("re-renders the tokens page's table in the new locale on a live switch", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const services = { client: makeTokensClient({ tokens: [SAMPLE_TOKENS[0]] }) };
  const tree = (catalog: ClientCatalog) => (
    <MessageProvider value={catalog}>
      <QueryClientProvider client={client}>
        <TokensProvider services={services}>
          <TokensPage />
        </TokensProvider>
      </QueryClientProvider>
    </MessageProvider>
  );
  const view = render(tree(english));
  expect((await screen.findAllByText("Last used")).length).toBeGreaterThan(0);

  view.rerender(tree(spanish));

  expect(screen.getAllByText("Último uso").length).toBeGreaterThan(0);
  expect(screen.queryByText("Last used")).toBeNull();
});
