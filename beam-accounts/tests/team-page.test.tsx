import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TeamPage } from "../src/team-page";
import {
  makeTeamClient,
  MockTeamProvider,
  TEAM_INVITATIONS,
} from "../src/team-story-harness";
import { mergeRoster } from "../src/team-roster";
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
it("renders members and pending invitations from the injected transports", async () => {
  render(
    <MockTeamProvider>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>,
  );
  expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
  expect(await screen.findByText("Grace Hopper")).toBeTruthy();
  expect(screen.getAllByText("alex@example.test").length).toBeGreaterThan(0);
});
it("does not show owner actions to an ordinary member", async () => {
  render(
    <MockTeamProvider>
      <TeamPage currentUserId="member" />
    </MockTeamProvider>,
  );
  await screen.findByText("Ada Lovelace");
  expect(screen.queryByRole("button", { name: /invite member/i })).toBeNull();
  expect(screen.queryByTitle("Resend invitation")).toBeNull();
});
it("resends through the injected client with the opaque invitation id", async () => {
  const client = makeTeamClient();
  client.resendInvitation = vi.fn(async () => undefined);
  render(
    <MockTeamProvider client={client}>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>,
  );
  const button = await screen.findByTitle("Resend invitation");
  fireEvent.click(button);
  await waitFor(() =>
    expect(client.resendInvitation).toHaveBeenCalledWith("invite"),
  );
});
it("excludes accepted invitations from the merged roster", () => {
  expect(
    mergeRoster(
      [],
      [{ ...TEAM_INVITATIONS[0], acceptedAt: "2026-09-02T00:00:00Z" }],
      null,
    ),
  ).toEqual([]);
});
