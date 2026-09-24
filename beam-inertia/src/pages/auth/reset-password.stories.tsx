import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm } from '../../story-harness';

/** Auth / ResetPassword — resolved via the public `resolveBeamPage` seam. */
function ResetPasswordStage({
    errors,
    forceProcessing,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
}) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({
        token: 'stub-token',
        email: 'ada@example.test',
        passwordRules: { minLength: 8 },
    });
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/reset-password').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Auth/ResetPassword',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-sm">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <ResetPasswordStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByDisplayValue('ada@example.test')).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => (
        <ResetPasswordStage
            errors={{ password: 'The password confirmation does not match.' }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText('The password confirmation does not match.'),
        ).toBeInTheDocument();
    },
};

export const Processing: Story = {
    render: () => <ResetPasswordStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: /reset password/i })).toBeDisabled();
    },
};

export const NarrowViewport: Story = {
    render: () => <ResetPasswordStage />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
