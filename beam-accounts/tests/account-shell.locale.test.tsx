import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ClientCatalog } from "@schemastud/messages";
import { MessageProvider } from "@schemastud/messages/react";
import { AccountShell } from "../src/account/AccountShell";

// Localization 29 (REVIEW-29A3 MEDIUM): with no navLabel, the shell's nav group label and mobile bar read the
// catalog, so they switch locale live. A destructured string default would keep them English.
afterEach(cleanup);
const english: ClientCatalog = { version: 1, locale: "en", realm: null, direction: "ltr", messages: {} };
const spanish: ClientCatalog = {
  version: 1,
  locale: "es",
  realm: null,
  direction: "ltr",
  messages: { "splicewire-beam-accounts::messages.account_account": { text: "Cuenta", sourceLocale: "es" } },
};
const nav = { items: [{ title: "Dashboard", href: "/account" }] };

it("labels the shell's nav in the reader's locale when the host passes no navLabel", () => {
  const tree = (catalog: ClientCatalog) => (
    <MessageProvider value={catalog}>
      <AccountShell nav={nav}>
        <p>page body</p>
      </AccountShell>
    </MessageProvider>
  );
  const view = render(tree(english));
  expect(screen.getAllByText("Account").length).toBeGreaterThan(0);

  view.rerender(tree(spanish));

  expect(screen.getAllByText("Cuenta").length).toBeGreaterThan(0);
  expect(screen.queryByText("Account")).toBeNull();
});
