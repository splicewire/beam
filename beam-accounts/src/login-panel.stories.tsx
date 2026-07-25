import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Button } from '@schemastud/ui';
import { LoginPanel } from './login-panel';
import { PasskeyButton } from './passkey-button';
import { AuthStage, MockAuthProvider } from './story-harness';

/**
 * Accounts / LoginPanel — the composed, transport-injected sign-in card. Every optional
 * control is prop-gated (passkey slot / remember / forgot link / host footer / brand lockup),
 * so a host renders only the controls whose backends exist. The brand + Google footer are
 * INJECTED (ADR-0092: brand stays in the app) — the package knows nothing about either.
 *
 * Treatment axes (ticket 13): **states** dominates — default / filled / error (invalid
 * credentials) / submitting. A **composition** fork (bare vs. fully-loaded: passkey slot +
 * remember + forgot + footer) stands in for the panel's real "variant" surface — it exposes
 * no enum `variant` prop, so per the rule of sanction that axis is a *composition* matrix, not
 * a select. **viewport** — mobile-first auth. Ambient token + light⊗dark inherited; the card /
 * divider / links are all semantic-token → clean `.dark`.
 */
const meta = {
    title: 'Accounts/LoginPanel',
    component: LoginPanel,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage>{Story()}</AuthStage>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const noop = () => {};

/** A tiny injected brand lockup, standing in for the host's real one. */
function DemoBrand() {
    return <div className="text-lg font-semibold tracking-tight">◆ Splicewire</div>;
}
/** A host-injected "Continue with Google" footer. */
function GoogleFooter() {
    return (
        <Button variant="outline" className="w-full" type="button">
            Continue with Google
        </Button>
    );
}

/** Bare — the ticket-03 shipping default: password only, every optional control gated off. */
export const Default: Story = {
    render: () => (
        <MockAuthProvider>
            <LoginPanel onSuccess={noop} />
        </MockAuthProvider>
    ),
};

/**
 * Fully loaded — brand + passkey slot + "Or continue with email" divider + remember + forgot
 * link + Google footer. The panel's composition "variant" surface, all on.
 */
export const FullyLoaded: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true }}>
            <LoginPanel
                onSuccess={noop}
                brand={<DemoBrand />}
                showPasskeySlot
                passkeySlot={<PasskeyButton onSuccess={noop} />}
                showRemember
                showForgotLink
                onForgot={noop}
                footer={<GoogleFooter />}
            />
        </MockAuthProvider>
    ),
};

/** Filled — `play` types credentials so VR captures a populated form. */
export const Filled: Story = {
    render: () => (
        <MockAuthProvider>
            <LoginPanel onSuccess={noop} showForgotLink onForgot={noop} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
        await userEvent.type(canvas.getByLabelText('Password'), 'hunter2hunter2');
    },
};

/**
 * Submitting — a `pending` login holds the request; `play` fills + submits and awaits the
 * disabled "Signing in…" button.
 */
export const Submitting: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'pending' }}>
            <LoginPanel onSuccess={noop} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
        await userEvent.type(canvas.getByLabelText('Password'), 'hunter2hunter2');
        await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));
        await expect(await canvas.findByRole('button', { name: /signing in/i })).toBeDisabled();
    },
};

/**
 * Error — invalid credentials. `play` fills + submits and awaits the settled inline
 * `role=alert` so VR captures the error state, never the transient submit.
 */
export const Error: Story = {
    render: () => (
        <MockAuthProvider config={{ outcome: 'error', errorMessage: 'Invalid email or password.' }}>
            <LoginPanel onSuccess={noop} />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
        await userEvent.type(canvas.getByLabelText('Password'), 'wrong-password');
        await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));
        await expect(await canvas.findByRole('alert')).toBeInTheDocument();
    },
};

/** Mobile viewport — the fully-loaded panel on a phone-width canvas. */
export const Mobile: Story = {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <MockAuthProvider config={{ withPasskey: true }}>
            <LoginPanel
                onSuccess={noop}
                brand={<DemoBrand />}
                showPasskeySlot
                passkeySlot={<PasskeyButton onSuccess={noop} />}
                showForgotLink
                onForgot={noop}
            />
        </MockAuthProvider>
    ),
};
