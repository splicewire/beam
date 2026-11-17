import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMessages, type ClientCatalog } from "@schemastud/messages";
import { MessageProvider } from "@schemastud/messages/react";
import catalog from "../messages.default.json";
import { CreateTeamForm } from "../src/create-team-form";
import { NoticeError, notice } from "../src/message-descriptor";
import { tokenFragment } from "../src/token-fragment";
import { errorMessage } from "../src/utils";

// Localization 29 part A3: the auth and team forms re-render in the new locale on a live switch; a thrown catalog line
// (a cancelled passkey ceremony) renders in the reader's locale through errorMessage; helper copy (tokenFragment)
// reads the catalog. Without a provider everything is the pre-29 English.
afterEach(cleanup);
const english: ClientCatalog = { version: 1, locale: "en", realm: null, direction: "ltr", messages: {} };
const spanish: ClientCatalog = {
  version: 1,
  locale: "es",
  realm: null,
  direction: "ltr",
  messages: {
    "splicewire-beam-accounts::messages.create_team_heading": { text: "Crea un equipo", sourceLocale: "es" },
    "splicewire-beam-accounts::messages.auth_passkey_verification_cancelled": { text: "Se canceló la verificación de la llave.", sourceLocale: "es" },
    "splicewire-beam-accounts::messages.fragment_secret": { text: "El token termina en :last", sourceLocale: "es" },
  },
};
const es = createMessages(catalog.messages, { catalog: spanish });

it("re-renders the create-team form in the new locale on a live switch", () => {
  const tree = (c: ClientCatalog) => (
    <MessageProvider value={c}>
      <CreateTeamForm onSubmit={() => {}} />
    </MessageProvider>
  );
  const view = render(tree(english));
  expect(screen.getByText("Create a team")).toBeTruthy();
  view.rerender(tree(spanish));
  expect(screen.getByText("Crea un equipo")).toBeTruthy();
});

it("renders a thrown catalog line and helper copy in the reader's locale", () => {
  const cancelled = new NoticeError(notice("splicewire-beam-accounts::messages.auth_passkey_verification_cancelled"));
  expect(cancelled.message).toBe("Passkey verification was cancelled.");
  expect(errorMessage(cancelled, "fallback")).toBe("Passkey verification was cancelled.");
  expect(errorMessage(cancelled, "fallback", es)).toBe("Se canceló la verificación de la llave.");

  const token = { id: 7, lastFour: "abcd" } as unknown as Parameters<typeof tokenFragment>[0];
  expect(tokenFragment(token).label).toBe("Token ends in abcd");
  expect(tokenFragment(token, es).label).toBe("El token termina en abcd");
});
