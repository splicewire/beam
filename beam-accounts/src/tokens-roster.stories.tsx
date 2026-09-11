import type { Meta, StoryObj } from "@storybook/react-vite";
import { TokensRoster } from "./tokens-roster";
import { MockTokensProvider } from "./story-harness";
const meta = {
  title: "Accounts/TokensRoster",
  component: TokensRoster,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TokensRoster>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {
  render: () => (
    <MockTokensProvider>
      <TokensRoster />
    </MockTokensProvider>
  ),
};
export const Empty: Story = {
  render: () => (
    <MockTokensProvider config={{ listState: "empty" }}>
      <TokensRoster />
    </MockTokensProvider>
  ),
};
export const Loading: Story = {
  render: () => (
    <MockTokensProvider config={{ listState: "loading" }}>
      <TokensRoster />
    </MockTokensProvider>
  ),
};
export const WithActivity: Story = {
  render: () => (
    <MockTokensProvider
      services={{
        renderTokenActivity: (token) => (
          <button>Activity for {token.name}</button>
        ),
      }}
    >
      <TokensRoster />
    </MockTokensProvider>
  ),
};
