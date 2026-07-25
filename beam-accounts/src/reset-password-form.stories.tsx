import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ResetPasswordForm } from './reset-password-form';
import { AuthStage, MockAuthProvider } from './story-harness';

/**
 * Accounts / ResetPasswordForm — set a new password from a reset link. Token + email are read
 * from the URL by the host and passed in; a tampered/expired token surfaces inline off the
 * backend rejection, and a client-side password-mismatch surfaces before any request.
 * Two `PasswordInput`s (new + confirm). All-semantic-token → clean `.dark`.
 *
 * Treatment axes (ticket 13): **states** — default / filled / validation-error (passwords
 * don't match, caught client-side) / submitting / success / server-error (invalid link).
 * **viewport** — mobile-first. Ambient token + light⊗dark inherited.
 */
const meta = {
    title: 'Accounts/ResetPasswordForm',
    component: ResetPasswordForm,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage>{Story()}</AuthStage>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const done = () => {};
const link = { token: 'reset-token-abc', email: 'ada@example.com' };

/** Default — empty new/confirm fields. */
export const Default: Story = {
    render: () => (
        <MockAuthProvider>
            <ResetPasswordForm {...link} onSuccess={done} />
        </MockAuthProvider>
    ),
};

/** Filled — both fields typed to a matching value. */
export const Filled: Story = {
    render: () => (
        <MockAuthProvider>
            <ResetPasswordForm {...link} onSuccess={done} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('New password'), 'sup3r-secret-pw');
        await userEvent.type(canvas.getByLabelText(/confirm new password/i), 'sup3r-secret-pw');
    },
};

/**
 * Validation error — the two passwords differ; `play` submits and awaits the settled
 * client-side "passwords do not match" alert (no request is even made).
 */
export const ValidationError: Story = {
    render: () => (
        <MockAuthProvider>
            <ResetPasswordForm {...link} onSuccess={done} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('New password'), 'password-one');
        await userEvent.type(canvas.getByLabelText(/confirm new password/i), 'password-two');
        await userEvent.click(canvas.getByRole('button', { name: /reset password/i }));
        await expect(await canvas.findByText(/passwords do not match/i)).toBeInTheDocument();
    },
};

/** Submitting — a `pending` outcome holds the reset; `play` fills matching + submits. */
export const Submitting: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'pending' }}>
            <ResetPasswordForm {...link} onSuccess={done} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('New password'), 'sup3r-secret-pw');
        await userEvent.type(canvas.getByLabelText(/confirm new password/i), 'sup3r-secret-pw');
        await userEvent.click(canvas.getByRole('button', { name: /reset password/i }));
        await expect(await canvas.findByRole('button', { name: /resetting/i })).toBeDisabled();
    },
};

/**
 * Server error — an invalid/expired reset link. `play` fills matching + submits and awaits
 * the settled inline alert off the backend rejection.
 */
export const Error: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'error', errorMessage: 'This reset link is invalid or has expired.' }}>
            <ResetPasswordForm {...link} onSuccess={done} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('New password'), 'sup3r-secret-pw');
        await userEvent.type(canvas.getByLabelText(/confirm new password/i), 'sup3r-secret-pw');
        await userEvent.click(canvas.getByRole('button', { name: /reset password/i }));
        await expect(await canvas.findByRole('alert')).toBeInTheDocument();
    },
};

/** Mobile viewport. */
export const Mobile: Story = {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <MockAuthProvider>
            <ResetPasswordForm {...link} onSuccess={done} />
        </MockAuthProvider>
    ),
};
