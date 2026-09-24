import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
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

/** Invite cancel — `play` opens the revoke confirm dialog for the pending invitation. */
export const InviteCancel: Story = {
  render: (args) => (
    <MockTeamProvider>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: `Revoke invitation for ${TEAM_INVITATIONS[0].email}` }),
    );
    const dialog = within(document.body);
    await expect(await dialog.findByText(/revoke the pending invitation for/i)).toBeInTheDocument();
    await expect(dialog.getByRole("button", { name: "Revoke invitation" })).toBeInTheDocument();
  },
};
