import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { AcceptInvitationPanel } from './accept-invitation-panel';
import { AuthStage } from './story-harness';

/**
 * Accounts / AcceptInvitationPanel — the `invitations.accept` page body (beam-inertia
 * `auth/accept-invitation`). One story per server verdict, because each offers a different next step:
 * accept, register/log in first, log out of the wrong account, or nothing but the reason.
 */
const meta = {
    title: 'Accounts/AcceptInvitationPanel',
    component: AcceptInvitationPanel,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage>{Story()}</AuthStage>],
    args: {
        state: 'ready',
        teamName: 'Acme Design',
        email: 'ivy@example.test',
        role: 'admin',
        inviterName: 'Olive Owner',
        viewerEmail: 'ivy@example.test',
        onAccept: () => {},
        onLogout: () => {},
        registerHref: '/register?email=ivy%40example.test',
        loginHref: '/login',
        homeHref: '/dashboard',
    },
} satisfies Meta<typeof AcceptInvitationPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ready — signed in as the invited address; one button takes the seat. */
export const Ready: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Join Acme Design' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Accept invitation' })).toBeEnabled();
    },
};

/** Guest — nobody signed in: register (email pre-filled) or log in, then come back. */
export const Guest: Story = {
    args: { state: 'guest', viewerEmail: null },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
        await expect(canvas.queryByRole('button', { name: 'Accept invitation' })).toBeNull();
    },
};

/** Wrong account — signed in as someone other than the invitee. */
export const WrongAccount: Story = {
    args: { state: 'wrong-account', viewerEmail: 'someone-else@example.test' },
};

/** Refused — the accept came back with the operation's reason. */
export const Refused: Story = {
    args: { error: 'This invitation has already been used.' },
};

/** Expired — past its window; ask for a new one. */
export const Expired: Story = {
    args: { state: 'expired' },
};

/** Used — the link has already been redeemed. */
export const Used: Story = {
    args: { state: 'used' },
};

/** Invalid — revoked, superseded or tampered; names no team. */
export const Invalid: Story = {
    args: { state: 'invalid', teamName: null, email: null, role: null, inviterName: null },
};
