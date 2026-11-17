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
