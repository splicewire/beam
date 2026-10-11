import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";

// C55: the narrow Pending summary must lead to its row before a long member roster.
// Reuse the C42 DataTable stackOnMobile contract; jsdom verifies structure/interactions,
// not browser geometry. Hoist matchMedia because the shared hook binds at import time.
const viewport = vi.hoisted(() => {
  const state = { narrow: true };
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("max-width") ? state.narrow : false;
    },
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return state;
});
vi.mock("@schemastud/seam", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@schemastud/seam")>()),
  SchemaForm: () => null,
}));
import { TeamPage } from "../src/team-page";
import { makeTeamClient, MockTeamProvider } from "../src/team-story-harness";

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

it("offers a pending-invitations disclosure before the mobile roster and preserves resend", async () => {
  viewport.narrow = true;
  window.innerWidth = 390;
  const client = makeTeamClient();
  client.resendInvitation = vi.fn(async () => undefined);
  render(
    <MockTeamProvider client={client}>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>
  );
  const disclosure = await screen.findByRole("button", {
    name: "View pending invitations (1)",
  });
  const member = screen.getByText("Ada Lovelace");
  expect(
    disclosure.compareDocumentPosition(member) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  fireEvent.click(disclosure);
  expect(screen.queryByText("Ada Lovelace")).toBeNull();
  const invite = screen.getByTestId("stacked-row-invite");
  expect(within(invite).getByText("Pending")).toBeTruthy();
  fireEvent.click(within(invite).getByTitle("Resend invitation"));
  await waitFor(() =>
    expect(client.resendInvitation).toHaveBeenCalledWith("invite")
  );
  fireEvent.click(screen.getByRole("button", { name: /^All/ }));
  expect(screen.getByText("Ada Lovelace")).toBeTruthy();
});

it("leaves the desktop roster and its initial all-members facet unchanged", async () => {
  viewport.narrow = false;
  window.innerWidth = 1440;
  render(
    <MockTeamProvider>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>
  );
  expect(await screen.findByRole("table")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: /View pending invitations/ })
  ).toBeNull();
  expect(screen.getByText("Ada Lovelace")).toBeTruthy();
  expect(screen.getAllByText("alex@example.test").length).toBeGreaterThan(0);
});
