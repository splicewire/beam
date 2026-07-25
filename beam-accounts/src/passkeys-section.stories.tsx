import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { PasskeysSection } from './passkeys-section';
import { AuthStage, MockAuthProvider, SAMPLE_PASSKEYS } from './story-harness';

/**
 * Accounts / PasskeysSection — the settings surface to register a passkey from a trusted
 * device, see your registered passkeys (name + last-used), and delete one. Wired the same
 * injected-transport way as the tokens surface; reads `client.passkey` off the AuthProvider.
 * All-semantic-token → clean `.dark`.
 *
 * Treatment axes (ticket 13): **states** — populated (a list) / empty (no passkeys yet) /
 * loading (the list is fetching). On an environment WITHOUT WebAuthn the register form is
 * replaced by a "not supported" note (a design state, exercised by the `withPasskey:false`
 * client which the section still list-renders). Ambient token + light⊗dark inherited.
 */
const meta = {
    title: 'Accounts/PasskeysSection',
    component: PasskeysSection,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage width="max-w-lg">{Story()}</AuthStage>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * Populated — three registered passkeys. `play` awaits a settled row label so a VR baseline
 * captures resolved data, not the loading flash.
 */
export const Populated: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true, passkeys: SAMPLE_PASSKEYS }}>
            <PasskeysSection />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/MacBook Pro/i)).toBeInTheDocument();
    },
};

/** Empty — no passkeys registered yet (the register form + the empty-list message). */
export const Empty: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true, passkeys: [] }}>
            <PasskeysSection />
        </MockAuthProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/no passkeys registered yet/i)).toBeInTheDocument();
    },
};

/** Loading — the list is fetching (a `pending` list holds it in the "Loading…" row). */
export const Loading: Story = {
    render: () => (
        <MockAuthProvider config={{ withPasskey: true, passkeysLoading: true }}>
            <PasskeysSection />
        </MockAuthProvider>
    ),
};
