import { afterEach, beforeAll, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ClientCatalog } from "@schemastud/messages";
import { MessageProvider } from "@schemastud/messages/react";
import { TeamPage } from "../src/team-page";
import { MockTeamProvider } from "../src/team-story-harness";

// Localization 29 part A2: the team page (its heading, the value-to-label maps, and the roster TABLE's memoized
// columns) re-renders in the new locale on a live switch; without a provider it is the pre-29 English.
afterEach(cleanup);
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});
const english: ClientCatalog = { version: 1, locale: "en", realm: null, direction: "ltr", messages: {} };
const spanish: ClientCatalog = {
  version: 1,
  locale: "es",
  realm: null,
  direction: "ltr",
  messages: {
    "splicewire-beam-accounts::messages.team_description": { text: "Personas e invitaciones pendientes de este equipo.", sourceLocale: "es" },
    "splicewire-beam-accounts::messages.team_facet_members": { text: "Miembros", sourceLocale: "es" },
    "splicewire-beam-accounts::messages.team_col_identity": { text: "Nombre / correo", sourceLocale: "es" },
  },
};
const tree = (catalog: ClientCatalog) => (
  <MessageProvider value={catalog}><MockTeamProvider><TeamPage currentUserId="owner" /></MockTeamProvider></MessageProvider>
);

it("re-renders the team page and its roster table in the new locale on a live switch", async () => {
  const view = render(tree(english));
  expect(await screen.findByText("People and pending invitations for this team.")).toBeTruthy();
  expect(screen.getAllByText("Members").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Name / email").length).toBeGreaterThan(0);

  view.rerender(tree(spanish));

  expect(await screen.findByText("Personas e invitaciones pendientes de este equipo.")).toBeTruthy();
  expect(screen.getAllByText("Miembros").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Nombre / correo").length).toBeGreaterThan(0);
  expect(screen.queryByText("Name / email")).toBeNull();
});
