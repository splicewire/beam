import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm } from '../../story-harness';

/** Auth / Register — resolved via the public `resolveBeamPage` seam (G6-BUILT-PACKAGE-PROOF). */
function RegisterStage({
    errors,
    forceProcessing,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
}) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({ passwordRules: { minLength: 8 } });
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/register').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Auth/Register',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-sm">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <RegisterStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Name')).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => (
        <RegisterStage
            errors={{
                email: 'The email has already been taken.',
                password: 'The password confirmation does not match.',
            }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('The email has already been taken.')).toBeInTheDocument();
    },
};

export const Processing: Story = {
    render: () => <RegisterStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: /create account/i })).toBeDisabled();
    },
};

export const NarrowViewport: Story = {
    render: () => <RegisterStage />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
