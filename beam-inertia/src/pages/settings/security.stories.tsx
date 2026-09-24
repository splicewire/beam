import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm } from '../../story-harness';

/** Settings / Security — resolved via the public `resolveBeamPage` seam. */
function SecurityStage({
    errors,
    forceProcessing,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
}) {
    const [Page, setPage] = useState<ComponentType<Record<string, unknown>> | null>(null);
    setStubPage({});
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('settings/security').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return (
        <Page
            canManageTwoFactor
            requiresConfirmation={false}
            twoFactorEnabled={false}
            canManagePasskeys
            passkeys={[]}
        />
    );
}

const meta = {
    title: 'Inertia/Settings/Security',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-2xl">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <SecurityStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Current password')).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => <SecurityStage errors={{ current_password: 'The password is incorrect.' }} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('The password is incorrect.')).toBeInTheDocument();
    },
};

export const Processing: Story = {
    render: () => <SecurityStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: /save/i })).toBeDisabled();
    },
};

export const NarrowViewport: Story = {
    render: () => <SecurityStage />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
