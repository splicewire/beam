import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { PasskeyButton } from './passkey-button';
import { AuthStage, MockAuthProvider } from './story-harness';

/**
 * Accounts / PasskeyButton — "Sign in with a passkey": runs the WebAuthn assertion ceremony
 * and completes sign-in like password login. It renders NOTHING when the device can't do
 * WebAuthn (a device fact read once via `isWebAuthnSupported()`); in the Storybook Chromium
 * WebAuthn IS present, so the button renders — the mocked passkey sub-client stubs the
 * ceremony so no real authenticator is invoked.
 *
 * Treatment axes (ticket 13): **states** — default / submitting ("Waiting for passkey…",
 * driven by a `pending` passkey outcome) / error (cancelled ceremony surfaced inline via
 * `AuthError`). The button itself is a `variant="outline"` foundation Button, so its own
 * variant axis is fixed by design (not author-selectable here). All-semantic-token → clean
 * `.dark`. Note: on an environment WITHOUT WebAuthn the component returns null by design —
 * an intentional empty render, not a broken story.
 */
const meta = {
    title: 'Accounts/PasskeyButton',
    component: PasskeyButton,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage width="max-w-xs">{Story()}</AuthStage>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const noop = () => {};

/** Default — the passkey CTA, idle. */
export const Default: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true }}>
            <PasskeyButton onSuccess={noop} />
        </MockAuthProvider>
    ),
};

/**
 * Submitting — a `pending` passkey outcome holds the ceremony open so the button shows
 * "Waiting for passkey…" and is disabled. `play` clicks it and waits for the settled label.
 */
export const Submitting: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true, passkeyOutcome: 'pending' }}>
            <PasskeyButton onSuccess={noop} label="Sign in with a passkey" />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /passkey/i }));
        await expect(await canvas.findByText(/waiting for passkey/i)).toBeInTheDocument();
    },
};

/**
 * Error — a cancelled/failed ceremony surfaces inline. `play` clicks, then awaits the
 * settled `role=alert` so VR captures the error line, never the in-flight state.
 */
export const Error: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true, passkeyOutcome: 'error' }}>
            <PasskeyButton onSuccess={noop} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /passkey/i }));
        await expect(await canvas.findByRole('alert')).toBeInTheDocument();
    },
};
