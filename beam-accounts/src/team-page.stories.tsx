import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { TeamPage } from "./team-page";
import { makeTeamClient, MockTeamProvider, TEAM_INVITATIONS, TEAM_MEMBERS } from "./team-story-harness";
const meta = {
  title: "Accounts/TeamPage",
  component: TeamPage,
  args: { currentUserId: "owner" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TeamPage>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * The owner's view of a settled roster — members only, no outstanding invitations. The pending row
 * is `InvitePending`'s state; with it here the two baselines were byte-identical.
 */
export const Owner: Story = {
  render: (args) => (
    <MockTeamProvider client={makeTeamClient(TEAM_MEMBERS, [])}>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(TEAM_MEMBERS[1].email)).toBeInTheDocument();
    await expect(canvas.queryByText(TEAM_INVITATIONS[0].email)).not.toBeInTheDocument();
  },
};
export const Member: Story = {
  args: { currentUserId: "member" },
  render: (args) => (
    <MockTeamProvider>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
};
export const Empty: Story = {
  render: (args) => (
    <MockTeamProvider client={makeTeamClient([], [])}>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
};
export const Failed: Story = {
  render: (args) => (
    <MockTeamProvider
      client={{
        ...makeTeamClient(),
        members: async () => {
          throw new Error("The roster is unavailable.");
        },
      }}
    >
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
};

/** Invite pending — the default fixture's unaccepted invitation row, beside the members (cf. `Owner`). */
export const InvitePending: Story = {
  render: (args) => (
    <MockTeamProvider>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect((await canvas.findAllByText(TEAM_INVITATIONS[0].email)).length).toBeGreaterThan(0);
  },
};

/** Cancel returns focus to the pending invitation action, which can reopen the dialog. */
export const InviteCancel: Story = {
  render: (args) => (
    <MockTeamProvider>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: `Revoke invitation for ${TEAM_INVITATIONS[0].email}`,
    });
    await userEvent.click(trigger);
    const dialog = within(document.body);
    await expect(await dialog.findByText(/revoke the pending invitation for/i)).toBeInTheDocument();
    await expect(dialog.getByRole("button", { name: "Revoke invitation" })).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(dialog.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await expect(await dialog.findByRole("dialog")).toBeInTheDocument();
  },
};

/** Owner with the host's "New team" door (`createTeamHref`), as the beam starters mount it. */
export const WithCreateTeam: Story = {
  args: { createTeamHref: "/teams/create" },
  render: (args) => (
    <MockTeamProvider client={makeTeamClient(TEAM_MEMBERS, [])}>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("link", { name: /new team/i })).toHaveAttribute("href", "/teams/create");
  },
};


/** The member action uses the same controlled confirmation dialog as invitation revocation. */
export const RemoveCancel: Story = {
  render: (args) => <MockTeamProvider><TeamPage {...args} /></MockTeamProvider>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", { name: "Remove grace@example.test" });
    for (let cycle = 0; cycle < 2; cycle++) {
      await userEvent.click(trigger);
      const dialog = within(await within(document.body).findByRole("dialog"));
      await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};

/** Transfer Cancel returns to the member's role control, including on a second attempt. */
export const TransferCancel: Story = {
  render: (args) => <MockTeamProvider><TeamPage {...args} /></MockTeamProvider>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const member = await canvas.findByText("Grace Hopper");
    const row = member.closest("tr");
    if (!row) throw new Error("Member row is missing");
    const trigger = within(row).getByRole("combobox");
    for (let cycle = 0; cycle < 2; cycle++) {
      await userEvent.click(trigger);
      await userEvent.click(await within(document.body).findByRole("option", { name: "Owner" }));
      const dialog = within(await within(document.body).findByRole("dialog"));
      await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};
