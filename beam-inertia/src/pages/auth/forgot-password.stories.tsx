import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm } from '../../story-harness';

/** Auth / ForgotPassword — resolved via the public `resolveBeamPage` seam. */
function ForgotPasswordStage({
    status,
    errors,
    forceProcessing,
}: {
    status?: string;
    errors?: Record<string, string>;
    forceProcessing?: boolean;
}) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({ status });
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/forgot-password').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Auth/ForgotPassword',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-sm">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <ForgotPasswordStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Email address')).toBeInTheDocument();
    },
};

/** Confirmation — a reset link was sent (the server-shared `status` flash). */
export const Confirmation: Story = {
    render: () => <ForgotPasswordStage status="A reset link will be sent if the account exists." />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText('A reset link will be sent if the account exists.'),
        ).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => <ForgotPasswordStage errors={{ email: 'We could not find a user with that email address.' }} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText('We could not find a user with that email address.'),
        ).toBeInTheDocument();
    },
};

export const Processing: Story = {
    render: () => <ForgotPasswordStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByRole('button', { name: /email password reset link/i }),
        ).toBeDisabled();
    },
};

export const NarrowViewport: Story = {
    render: () => <ForgotPasswordStage />,
    parameters: { viewport: { defaultViewport: 'mobile1' } },
};
