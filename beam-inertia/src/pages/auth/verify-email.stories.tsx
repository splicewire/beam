import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm } from '../../story-harness';

/** Auth / VerifyEmail — resolved via the public `resolveBeamPage` seam. */
function VerifyEmailStage({ status, forceProcessing }: { status?: string; forceProcessing?: boolean }) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({ status });
    setStubForm({ forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/verify-email').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Auth/VerifyEmail',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-sm">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <VerifyEmailStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByRole('button', { name: /resend verification email/i }),
        ).toBeInTheDocument();
    },
};

/** Confirmation — a fresh verification link was just sent. */
export const Confirmation: Story = {
    render: () => <VerifyEmailStage status="verification-link-sent" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/a new verification link has been sent/i)).toBeInTheDocument();
    },
};

export const Processing: Story = {
    render: () => <VerifyEmailStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByRole('button', { name: /resend verification email/i }),
        ).toBeDisabled();
    },
};

export const NarrowViewport: Story = {
    render: () => <VerifyEmailStage />,
    parameters: { viewport: { defaultViewport: 'mobile1' } },
};
