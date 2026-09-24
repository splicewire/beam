import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm } from '../../story-harness';

/** Settings / Profile — resolved via the public `resolveBeamPage` seam. */
function ProfileStage({
    errors,
    forceProcessing,
    mustVerifyEmail = false,
    status,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
    mustVerifyEmail?: boolean;
    status?: string;
}) {
    const [Page, setPage] = useState<ComponentType<Record<string, unknown>> | null>(null);
    setStubPage({
        auth: {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.test',
                email_verified_at: mustVerifyEmail ? null : '2026-01-01T00:00:00Z',
            },
        },
    });
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('settings/profile').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page mustVerifyEmail={mustVerifyEmail} status={status} />;
}

const meta = {
    title: 'Inertia/Settings/Profile',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-2xl">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <ProfileStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Name')).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => <ProfileStage errors={{ email: 'The email has already been taken.' }} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('The email has already been taken.')).toBeInTheDocument();
    },
};

export const Processing: Story = {
    render: () => <ProfileStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: /save/i })).toBeDisabled();
    },
};

/** Confirmation — a verification email was just re-sent. */
export const Confirmation: Story = {
    render: () => (
        <ProfileStage mustVerifyEmail status="verification-link-sent" />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/a new verification link has been/i)).toBeInTheDocument();
    },
};

export const NarrowViewport: Story = {
    render: () => <ProfileStage />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
