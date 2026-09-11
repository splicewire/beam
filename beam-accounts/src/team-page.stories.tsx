import type { Meta, StoryObj } from "@storybook/react-vite";
import { TeamPage } from "./team-page";
import { makeTeamClient, MockTeamProvider } from "./team-story-harness";
const meta = {
  title: "Accounts/TeamPage",
  component: TeamPage,
  args: { currentUserId: "owner" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TeamPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Owner: Story = {
  render: (args) => (
    <MockTeamProvider>
      <TeamPage {...args} />
    </MockTeamProvider>
  ),
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
