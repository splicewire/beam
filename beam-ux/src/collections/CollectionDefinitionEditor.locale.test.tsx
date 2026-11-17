import type { ClientCatalog } from "@schemastud/messages";
import { MessageProvider } from "@schemastud/messages/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CollectionDefinitionEditor, CollectionRegistrationImpact } from "./CollectionDefinitionEditor";
import type { CollectionDefinitionInputData } from "./generated";

// Localization 31 part A follow-up (the REVIEW-31D class): the save failure is kept as a catalog line and translated
// when it renders, so a live locale switch re-renders the alert already showing.
afterEach(cleanup);
const initial: CollectionDefinitionInputData = {
  stem: "https://tenant.test/schemas/posts",
  baseVersion: 3,
  label: "Posts",
  nameField: "title",
  fields: [{ name: "title", type: "string", required: true, public: false, filterable: true, sortable: false, unique: true, relation: null }],
};
const schema = { type: "object", required: ["label"], properties: { label: { type: "string", title: "Label" }, stem: { type: "string", title: "Stem" }, baseVersion: { type: "integer" } } };
const impact = { schemaFingerprint: "a".repeat(64), pages: [{ id: "page-1", title: "Published article", publishedVersion: "pin-7", fields: ["subtitle"] }] };
const english: ClientCatalog = { version: 1, locale: "en", realm: null, direction: "ltr", messages: {} };
const spanish: ClientCatalog = {
  version: 1,
  locale: "es",
  realm: null,
  direction: "ltr",
  messages: { "splicewire-beam-ux::messages.collections_review_impact": { text: "Revisa las páginas publicadas afectadas antes de guardar esta versión.", sourceLocale: "es" } },
};

it("re-renders the save failure already showing in the new locale", async () => {
  const onSave = vi.fn().mockRejectedValue(new CollectionRegistrationImpact(impact));
  const tree = (catalog: ClientCatalog) => (
    <MessageProvider value={catalog}>
      <CollectionDefinitionEditor schema={schema} initial={initial} onSave={onSave} onCancel={() => {}} />
    </MessageProvider>
  );
  const view = render(tree(english));
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Review the affected published pages before saving this version.");

  view.rerender(tree(spanish));

  expect(screen.getByRole("alert").textContent).toBe("Revisa las páginas publicadas afectadas antes de guardar esta versión.");
});
