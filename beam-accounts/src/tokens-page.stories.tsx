import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { TokensPage } from './tokens-page';
import { MockTokensProvider, SAMPLE_TOKENS } from './story-harness';

/**
 * Accounts / TokensPage — the API-keys / tokens management surface (the package's customer-zero
 * component). Portable, tenancy-agnostic, DTO-first: owns its react-query data logic, types off
 * the generated `ApiTokenData` projection, and takes transport + feedback + host chrome as
 * injected services via `<TokensProvider>`. Composes the foundation `DataTable`, `Dialog`s,
 * `Popover` kebab, facet chip-bar, and the reveal-once secret panel.
 *
 * Treatment axes (ticket 13): **states** dominates — populated / empty / loading (the
 * DataTable's own loading prop) / with-archived / create-dialog-open. Filtering is a live
 * facet-chip surface (`play`-toggled). Ambient token + light⊗dark inherited.
 *
 * **Honest catalog note (ticket-32):** the reveal-once secret panel's warning banner uses
 * self-contained `amber-500/*` hex WITH an explicit `dark:` variant block (it re-skins across
 * schemes by hand, not via a semantic token). That is a *pre-existing* deliberate accent, not
 * a re-skin gap — recorded here, not changed. Everything else is semantic-token → clean `.dark`.
 */
const meta = {
    title: 'Accounts/TokensPage',
    component: TokensPage,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-5xl p-4">{Story()}</div>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Populated — the default API-token filter. `play` awaits a settled row so a VR baseline
 * captures resolved data, never the loading flash.
 */
export const Populated: Story = {
    render: () => (
        <MockTokensProvider config={{ tokens: SAMPLE_TOKENS }}>
            <TokensPage />
        </MockTokensProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('CI deploys')).toBeInTheDocument();
    },
};

/** Empty — no tokens yet (the DataTable empty message). */
export const Empty: Story = {
    render: () => (
        <MockTokensProvider config={{ listState: 'empty' }}>
            <TokensPage />
        </MockTokensProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/no tokens yet/i)).toBeInTheDocument();
    },
};

/** Loading — the token list is fetching (the DataTable's loading state). */
export const Loading: Story = {
    render: () => (
        <MockTokensProvider config={{ listState: 'loading' }}>
            <TokensPage />
        </MockTokensProvider>
    ),
};

/**
 * Filtered to sessions — `play` toggles the "API" chip off + "Session" on so VR captures the
 * session rows (incl. the "This session" badge on the current, un-actionable row).
 */
export const FilteredToSessions: Story = {
    render: () => (
        <MockTokensProvider config={{ tokens: SAMPLE_TOKENS }}>
            <TokensPage />
        </MockTokensProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByText('CI deploys');
        await userEvent.click(canvas.getByRole('button', { name: 'API', pressed: true }));
        await userEvent.click(canvas.getByRole('button', { name: 'Session', pressed: false }));
        await expect(await canvas.findByText('Chrome · macOS')).toBeInTheDocument();
    },
};

/**
 * With archived — `play` reveals the archived (soft-revoked) rows, which carry the "Archived"
 * badge and a permanent-delete action. Also shows the API + archived filter interplay.
 */
export const WithArchived: Story = {
    render: () => (
        <MockTokensProvider config={{ tokens: SAMPLE_TOKENS }}>
            <TokensPage />
        </MockTokensProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByText('CI deploys');
        await userEvent.click(await canvas.findByRole('button', { name: /archived/i }));
        await expect(await canvas.findByText('Old staging key')).toBeInTheDocument();
    },
};

/**
 * Create dialog open — `play` opens the "New token" dialog so VR captures the mint form
 * (name + full/scoped access toggle + lifetime select).
 */
export const CreateDialog: Story = {
    render: () => (
        <MockTokensProvider config={{ tokens: SAMPLE_TOKENS }}>
            <TokensPage />
        </MockTokensProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: /new token/i }));
        // Dialog renders in a portal (document.body), so query the whole document.
        const dialog = within(document.body);
        await expect(await dialog.findByText(/new api token/i)).toBeInTheDocument();
    },
};
