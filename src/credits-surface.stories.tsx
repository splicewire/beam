import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CreditsSurface } from './CreditsSurface';
import {
    MockCommerceProvider,
    RELOAD_CAPTURED,
    RELOAD_DECLINED,
    WALLET_EMPTY,
    WALLET_FUNDED,
    type CommerceMockConfig,
} from './story-harness';

/**
 * Commerce / CreditsSurface — the prepaid wallet: the derived balance headline, the append-only
 * credit ledger, and the top-up overlay. DTO-first (typed off the generated `WalletBalanceData`
 * projection) and transport-blind: the host injects one adapter through `<CommerceProvider>`.
 *
 * **The axis that dominates here is CUSTODY**, because it decides what the overlay can honestly say:
 *
 *  - **direct rail** (`client.reloadCredits`, the standalone Commerce host): the server places a
 *    CreditTopup Order through its configured money-in driver and the wallet is funded — or not —
 *    before the response returns. So the overlay resolves to `Credits added.` or to a decline with
 *    its code, the unchanged balance and a retry. Both arms are RESOLVED values; only a transport
 *    failure is an error.
 *  - **hosted checkout** (`client.startTopupCheckout`, splicewire-app): Stripe captures in the
 *    browser and a verified webhook funds the wallet later, so the overlay can only show a
 *    non-dismissable "crediting…" window and wait for the balance to move.
 *
 * The remaining states — empty, loading, read failure — are the same on both.
 */
const meta = {
    title: 'Commerce/CreditsSurface',
    component: CreditsSurface,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-4xl p-4">{Story()}</div>],
} satisfies Meta<typeof CreditsSurface>;

export default meta;
type Story = StoryObj<typeof CreditsSurface>;

function withProvider(mock: CommerceMockConfig): Story['render'] {
    return () => (
        <MockCommerceProvider mock={mock}>
            <CreditsSurface />
        </MockCommerceProvider>
    );
}

/** Empty — a fresh host, nothing bought yet. The ledger offers the next step, not a blank table. */
export const Empty: Story = {
    render: withProvider({ wallet: WALLET_EMPTY }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Prepaid balance')).toBeInTheDocument();
        await expect(await canvas.findByText(/No credit activity yet/i)).toBeInTheDocument();
    },
};

/** Loading — the wallet read is in flight. */
export const Loading: Story = {
    render: withProvider({ walletPending: true }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Loading wallet…')).toBeInTheDocument();
    },
};

/** Read failure — say so, rather than render a zero balance that looks like a real one. */
export const ReadFailed: Story = {
    render: withProvider({ walletError: 'Wallet is unavailable right now.' }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Wallet is unavailable right now.')).toBeInTheDocument();
    },
};

/** Populated — one captured reload behind it, balance reconciling to the ledger row for row. */
export const Populated: Story = {
    render: withProvider({ wallet: WALLET_FUNDED }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect((await canvas.findAllByText('$100.00')).length).toBeGreaterThan(0);
        await expect(await canvas.findByText('Credit ledger')).toBeInTheDocument();
    },
};

/** Success — the direct rail captured, and the balance in the result is already the new one. */
export const ReloadCaptured: Story = {
    render: withProvider({ wallet: WALLET_EMPTY, reloads: [RELOAD_CAPTURED] }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(await canvas.findByRole('button', { name: /add credits/i }));

        const sheet = within(document.body);
        await userEvent.click(await sheet.findByRole('button', { name: /pay & add credits/i }));

        await expect(await sheet.findByText('Credits added.')).toBeInTheDocument();
        await expect(await sheet.findByText(/captured on the/i)).toBeInTheDocument();
    },
};

/**
 * Declined — the fake rail's magic amount ($666.02). The alert carries the rail's own code, says the
 * balance is unchanged, and offers the retry. Nothing here is an error state.
 */
export const ReloadDeclined: Story = {
    render: withProvider({ wallet: WALLET_EMPTY, reloads: [RELOAD_DECLINED] }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(await canvas.findByRole('button', { name: /add credits/i }));

        const sheet = within(document.body);
        await userEvent.click(await sheet.findByRole('button', { name: /pay & add credits/i }));

        const alert = await sheet.findByRole('alert');
        await expect(alert).toHaveTextContent('Declined');
        await expect(alert).toHaveTextContent('card_declined');
        await expect(alert).toHaveTextContent(/balance is unchanged/i);
        await expect(await sheet.findByRole('button', { name: /try again/i })).toBeInTheDocument();
    },
};

/**
 * Retry — declined first, and Try again returns to the amount step, not a dead end. The play stops
 * on that returned amount step: the second, captured attempt ends on the same frame as
 * `ReloadCaptured`, which is not what this story is named for (the captured second attempt is
 * proven in `tests/commerce.test.tsx`, "retries after a decline and captures on the second attempt").
 */
export const ReloadRetriedAfterDecline: Story = {
    render: withProvider({
        wallet: WALLET_EMPTY,
        reloads: [RELOAD_DECLINED, RELOAD_CAPTURED],
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(await canvas.findByRole('button', { name: /add credits/i }));

        const sheet = within(document.body);
        await userEvent.click(await sheet.findByRole('button', { name: /pay & add credits/i }));
        await userEvent.click(await sheet.findByRole('button', { name: /try again/i }));

        await expect(await sheet.findByRole('button', { name: /pay & add credits/i })).toBeEnabled();
        await expect(sheet.queryByRole('alert')).not.toBeInTheDocument();
    },
};

/**
 * Hosted checkout — the OTHER custody model, for a host that declares no direct rail. Funding is
 * webhook-confirmed, so the overlay refuses dismissal and waits instead of claiming an outcome.
 */
export const HostedCheckoutCrediting: Story = {
    render: withProvider({ wallet: WALLET_EMPTY, hostedCheckout: true }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(await canvas.findByRole('button', { name: /add credits/i }));

        const sheet = within(document.body);
        await userEvent.click(await sheet.findByRole('button', { name: /pay & add credits/i }));

        await expect(await sheet.findByText(/crediting your wallet/i)).toBeInTheDocument();
    },
};
