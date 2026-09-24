import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CreateTeamForm } from "../src/create-team-form";
import { AcceptInvitationPanel } from "../src/accept-invitation-panel";
import { TeamPage } from "../src/team-page";
import { makeTeamClient, MockTeamProvider } from "../src/team-story-harness";

afterEach(cleanup);

// ── CreateTeamForm ──────────────────────────────────────────────────────────────

it("keeps Create team disabled until a name is typed, then submits the trimmed name", () => {
  const onSubmit = vi.fn();
  render(<CreateTeamForm onSubmit={onSubmit} />);

  const submit = screen.getByRole("button", { name: "Create team" });
  expect((submit as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("Team name"), { target: { value: "  Rocket Club " } });
  expect((submit as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(submit);
  expect(onSubmit).toHaveBeenCalledWith({ name: "Rocket Club" });
});

it("does not submit a whitespace-only name or while a request is in flight", () => {
  const onSubmit = vi.fn();
  const { rerender } = render(<CreateTeamForm onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText("Team name"), { target: { value: "   " } });
  fireEvent.submit(screen.getByRole("form", { name: "Create a team" }));

  rerender(<CreateTeamForm onSubmit={onSubmit} defaultName="Busy" processing />);
  expect(screen.getByRole("button", { name: "Creating…" })).toBeTruthy();
  fireEvent.submit(screen.getByRole("form", { name: "Create a team" }));

  expect(onSubmit).not.toHaveBeenCalled();
});

it("shows the server's name error against the field", () => {
  render(<CreateTeamForm onSubmit={() => {}} errors={{ name: "The name field is required." }} />);
  expect(screen.getByRole("alert").textContent).toBe("The name field is required.");
  expect(screen.getByLabelText("Team name").getAttribute("aria-invalid")).toBe("true");
});

// ── AcceptInvitationPanel ──────────────────────────────────────────────────────

const invitation = {
  teamName: "Acme",
  email: "ivy@example.test",
  role: "admin",
  inviterName: "Olive Owner",
};

it("offers the invitee exactly one action when ready, and runs it", () => {
  const onAccept = vi.fn();
  render(<AcceptInvitationPanel state="ready" {...invitation} viewerEmail="ivy@example.test" onAccept={onAccept} />);

  expect(screen.getByRole("heading", { name: "Join Acme" })).toBeTruthy();
  expect(screen.getByText(/Olive Owner invited/).textContent).toContain("as Admin");
  fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
  expect(onAccept).toHaveBeenCalledTimes(1);
});

it("sends a guest to register or log in, never to accept", () => {
  render(<AcceptInvitationPanel state="guest" {...invitation} registerHref="/register?email=ivy" loginHref="/login" />);

  expect(screen.getByRole("link", { name: "Create account" }).getAttribute("href")).toBe("/register?email=ivy");
  expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/login");
  expect(screen.queryByRole("button", { name: "Accept invitation" })).toBeNull();
});

it("tells a wrong account who the invitation is for and offers to log out", () => {
  const onLogout = vi.fn();
  render(
    <AcceptInvitationPanel state="wrong-account" {...invitation} viewerEmail="other@example.test" onLogout={onLogout} />,
  );

  expect(screen.getByRole("heading", { name: "This invitation is for someone else" })).toBeTruthy();
  expect(screen.getByText(/other@example\.test/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Accept invitation" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Log out" }));
  expect(onLogout).toHaveBeenCalled();
});

it.each([
  ["expired", "This invitation has expired"],
  ["used", "This invitation has already been used"],
  ["invalid", "This invitation link isn't valid"],
] as const)("explains a %s link and offers no accept", (state, heading) => {
  render(<AcceptInvitationPanel state={state} {...invitation} homeHref="/dashboard" />);

  expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Accept invitation" })).toBeNull();
  expect(screen.getByRole("link", { name: "Go to your dashboard" }).getAttribute("href")).toBe("/dashboard");
});

it("shows a refused accept's reason", () => {
  render(<AcceptInvitationPanel state="ready" {...invitation} onAccept={() => {}} error="This invitation has already been used." />);
  expect(screen.getByRole("alert").textContent).toBe("This invitation has already been used.");
});

// ── TeamPage's New team door ───────────────────────────────────────────────────

it("links to the host's create-team page only when one is given", async () => {
  const { unmount } = render(
    <MockTeamProvider client={makeTeamClient()}>
      <TeamPage currentUserId="owner" createTeamHref="/teams/create" />
    </MockTeamProvider>,
  );
  expect((await screen.findByRole("link", { name: /new team/i })).getAttribute("href")).toBe("/teams/create");
  unmount();

  render(
    <MockTeamProvider client={makeTeamClient()}>
      <TeamPage currentUserId="owner" />
    </MockTeamProvider>,
  );
  await screen.findByRole("heading", { name: "Team" });
  expect(screen.queryByRole("link", { name: /new team/i })).toBeNull();
});
