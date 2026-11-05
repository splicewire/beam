import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@schemastud/ui";
import { TokensRoster } from "./tokens-roster";
import { MockTokensProvider, rosterTokens } from "./story-harness";

// "Last used" reads "Nd ago" from the clock; these ages stay put whatever day the story runs.
const tokens = rosterTokens();
const meta = {
  title: "Accounts/TokensRoster",
  component: TokensRoster,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TokensRoster>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {
  render: () => (
    <MockTokensProvider config={{ tokens }}>
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
      config={{ tokens }}
      services={{
        // A host renders its own control here; the fixture stands in with the kit's small outline
        // button, as a host would, rather than a bare unstyled <button>.
        renderTokenActivity: (token) => (
          <Button variant="outline" size="sm" aria-label={`Activity for ${token.name}`}>
            Activity
          </Button>
        ),
      }}
    >
      <TokensRoster />
    </MockTokensProvider>
  ),
};

// owner-review-20261102 K-28: one owner held 24 tokens named `dev-login-as`. A token minted after the
// change shows its secret's last four; one minted before shows the tail of its id, labelled "id".
const sameName = tokens[0];
export const SameNamedTokens: Story = {
  render: () => (
    <MockTokensProvider
      config={{
        tokens: [
          { ...sameName, id: "0f1e2d3c-4b5a-4697-8899-aabbccdd3f9a", name: "dev-login-as", lastFour: "c41e" },
          { ...sameName, id: "0f1e2d3c-4b5a-4697-8899-aabbccdd7d02", name: "dev-login-as", lastFour: "08b5" },
          { ...sameName, id: "0f1e2d3c-4b5a-4697-8899-aabbccdd6fa8", name: "dev-login-as", lastFour: null },
        ],
      }}
    >
      <TokensRoster />
    </MockTokensProvider>
  ),
};
