import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AutoReloadConfigCard } from './AutoReloadConfigCard';
import {
    ACTIVE_CONFIG,
    MockAutoReloadProvider,
    NEEDS_CARD_CONFIG,
    OFF_CONFIG,
    OVER_POLICY_CONFIG,
    SCA_CONFIG,
    SUSPENDED_CONFIG,
    TO_TARGET_CONFIG,
    type AutoReloadMockConfig,
} from './story-harness';
import type { AutoReloadConfig } from './types';

/**
 * Commerce / AutoReloadConfigCard — the prepaid-credit auto-reload config surface (the package's
 * customer-zero component). Portable, tenancy-agnostic, DTO-first: owns its react-query save
 * logic, types off the generated `AutoReloadConfigData` projection, and takes transport +
 * feedback + the Stripe SetupIntent host slot as injected services via `<AutoReloadProvider>`.
 * Composes the foundation `Card`, `Input`, `Switch`, `Badge`, `Button`.
 *
 * Treatment axes: **status** dominates — off / active / suspended (repeated-failure) /
 * sca-required / needs-card; plus the amount-mode fork (fixed ⊗ to_target) and the
 * clamp-hint (over-policy) variant. Ambient token + light⊗dark inherited.
 */
const meta = {
    title: 'Commerce/AutoReloadConfigCard',
    component: AutoReloadConfigCard,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-2xl p-4">{Story()}</div>],
} satisfies Meta<typeof AutoReloadConfigCard>;

export default meta;
type Story = StoryObj<typeof AutoReloadConfigCard>;

function withProvider(config: AutoReloadConfig, mock?: AutoReloadMockConfig): Story['render'] {
    return () => (
        <MockAutoReloadProvider config={{ config, ...mock }}>
            <AutoReloadConfigCard config={config} />
        </MockAutoReloadProvider>
    );
}

/** Active — armed and chargeable, a saved card on file. */
export const Active: Story = {
    render: withProvider(ACTIVE_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Active')).toBeInTheDocument();
    },
};

/** Off — never turned on; the deal is still visible but dimmed. */
export const Off: Story = { render: withProvider(OFF_CONFIG) };

/** Suspended (repeated failure) — the failure banner + "Update card" re-arm CTA. */
export const SuspendedRepeatedFailure: Story = {
    render: withProvider(SUSPENDED_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/paused after 3 failed charges/i)).toBeInTheDocument();
    },
};

/** SCA required — the bank-authentication banner + "Re-authorize card" CTA. */
export const ScaRequired: Story = {
    render: withProvider(SCA_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/confirm this card/i)).toBeInTheDocument();
    },
};

/** Needs a card — the card vanished; needs-card banner + card-on-file warning row. */
export const NeedsCard: Story = {
    render: withProvider(NEEDS_CARD_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Needs a card')).toBeInTheDocument();
    },
};

/** to_target mode — the "Up to a target" fork of the amount control. */
export const ToTarget: Story = {
    render: withProvider(TO_TARGET_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Top up to')).toBeInTheDocument();
    },
};

/** Clamp hint — over-policy raw values surface the "Clamped to $X" effective-ceiling hint. */
export const ClampHint: Story = {
    render: withProvider(OVER_POLICY_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findAllByText(/Clamped to/i)).toHaveLength(4);
    },
};

/** The Save button routes through the injected `client.updateConfig` (contract kind 1). */
export const SaveRoundTrips: Story = {
    render: withProvider(ACTIVE_CONFIG),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: /save changes/i }));
        await expect(await canvas.findByText('Saved.')).toBeInTheDocument();
    },
};
