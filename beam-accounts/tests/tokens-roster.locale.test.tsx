import { createMessages, type ClientCatalog } from "@schemastud/messages";
import { expect, it } from "vitest";
import catalog from "../messages.default.json";
import { expiryLabel, tokenScopeSchema, tokenScopeSchemaFor } from "../src/tokens-roster";

// Localization 29 part A1: copy the token helpers return (and the create-token schema's titles) reads the reader's
// catalog; without one it is the pre-29 English, byte for byte.
const spanish: ClientCatalog = {
  version: 1,
  locale: "es",
  realm: null,
  direction: "ltr",
  messages: {
    "splicewire-beam-accounts::messages.tokens_never_expires": { text: "No caduca nunca", sourceLocale: "es" },
    "splicewire-beam-accounts::messages.tokens_field_name": { text: "Nombre del token", sourceLocale: "es" },
  },
};
const es = createMessages(catalog.messages, { catalog: spanish });

it("returns helper copy in the reader's locale, and the pre-29 English without one", () => {
  const now = Date.parse("2026-06-01T00:00:00Z");
  expect(expiryLabel({ expiresAt: null }, now)).toBe("Never expires");
  expect(expiryLabel({ expiresAt: null }, now, es)).toBe("No caduca nunca");

  const english = tokenScopeSchema.properties as Record<string, { title: string }>;
  expect(english.name.title).toBe("Token name");
  const localized = tokenScopeSchemaFor(es).properties as Record<string, { title: string }>;
  expect(localized.name.title).toBe("Nombre del token");
});

it("re-renders the token table in the new locale on a live switch", async () => {
  const { render, screen, cleanup } = await import("@testing-library/react");
  const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
  const { MessageProvider } = await import("@schemastud/messages/react");
  const { TokensRoster } = await import("../src/tokens-roster");
  const { TokensProvider } = await import("../src/provider");
  const { makeTokensClient, SAMPLE_TOKENS } = await import("../src/story-harness");
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  const english: ClientCatalog = { version: 1, locale: "en", realm: null, direction: "ltr", messages: {} };
  const tableSpanish: ClientCatalog = {
    ...spanish,
    messages: { ...spanish.messages, "splicewire-beam-accounts::messages.tokens_col_last_used": { text: "Último uso", sourceLocale: "es" } },
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const services = { client: makeTokensClient({ tokens: [SAMPLE_TOKENS[0]] }) };
  const tree = (catalog: ClientCatalog) => (
    <MessageProvider value={catalog}>
      <QueryClientProvider client={client}>
        <TokensProvider services={services}>
          <TokensRoster />
        </TokensProvider>
      </QueryClientProvider>
    </MessageProvider>
  );
  const view = render(tree(english));
  expect((await screen.findAllByText("Last used")).length).toBeGreaterThan(0);

  view.rerender(tree(tableSpanish));

  expect(screen.getAllByText("Último uso").length).toBeGreaterThan(0);
  expect(screen.queryByText("Last used")).toBeNull();
  cleanup();
});
