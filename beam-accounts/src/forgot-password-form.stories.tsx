import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ForgotPasswordForm } from './forgot-password-form';
import { AuthStage, MockAuthProvider } from './story-harness';

/**
 * Accounts / ForgotPasswordForm — request an enumeration-safe reset link. On submit it always
 * shows the same confirmation whether or not the email exists (mirroring the backend), so it
 * can't be used to discover accounts. All-semantic-token → clean `.dark`.
 *
 * Treatment axes (ticket 13): **states** dominates — default (empty) / filled / submitting /
 * success (the `role=status` confirmation) / error (send failed). **viewport** — auth forms
 * are mobile-first, so a mobile story is carried. Ambient token + light⊗dark inherited.
 */
const meta = {
    title: 'Accounts/ForgotPasswordForm',
    component: ForgotPasswordForm,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage>{Story()}</AuthStage>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const back = () => {};

/** Default — empty, with the "Back to sign in" link. */
export const Default: Story = {
    render: () => (
        <MockAuthProvider>
            <ForgotPasswordForm onBack={back} />
        </MockAuthProvider>
    ),
};

/** Filled — `play` types an address so VR captures a populated field. */
export const Filled: Story = {
    render: () => (
        <MockAuthProvider>
            <ForgotPasswordForm onBack={back} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText(/email/i), 'ada@example.com');
    },
};

/**
 * Submitting — a `pending` outcome holds the request open; `play` fills + submits and awaits
 * the disabled "Sending…" button so VR captures the in-flight state settled.
 */
export const Submitting: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'pending' }}>
            <ForgotPasswordForm onBack={back} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText(/email/i), 'ada@example.com');
        await userEvent.click(canvas.getByRole('button', { name: /email a reset link/i }));
        await expect(await canvas.findByRole('button', { name: /sending/i })).toBeDisabled();
    },
};

/**
 * Success — `play` submits and awaits the settled `role=status` enumeration-safe confirmation
 * (the form swaps itself out for the message).
 */
export const Success: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'success' }}>
            <ForgotPasswordForm onBack={back} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText(/email/i), 'ada@example.com');
        await userEvent.click(canvas.getByRole('button', { name: /email a reset link/i }));
        await expect(await canvas.findByRole('status')).toBeInTheDocument();
    },
};

/** Error — the send failed; `play` submits and awaits the settled inline `role=alert`. */
export const Error: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'error', errorMessage: 'Could not send the reset link.' }}>
            <ForgotPasswordForm onBack={back} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText(/email/i), 'ada@example.com');
        await userEvent.click(canvas.getByRole('button', { name: /email a reset link/i }));
        await expect(await canvas.findByRole('alert')).toBeInTheDocument();
    },
};

/** Mobile viewport — the form on a phone-width canvas. */
export const Mobile: Story = {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <MockAuthProvider>
            <ForgotPasswordForm onBack={back} />
        </MockAuthProvider>
    ),
};
