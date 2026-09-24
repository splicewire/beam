import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage } from '../../story-harness';

/**
 * Account / Create team — the packaged `account/create-team` page (`teams.create`), resolved through
 * the public `resolveBeamPage` seam. The body is `@splicewire/beam-accounts`' <CreateTeamForm>; the page
 * supplies the operation URL and hands back the server's `name` error.
 */
function CreateTeamStage({ errors }: { errors?: Record<string, string> }) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({ action: '/teams/create', cancelUrl: '/dashboard', errors: errors ?? {} });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('account/create-team').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Account/CreateTeam',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-2xl">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Empty: Story = {
    render: () => <CreateTeamStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('heading', { name: 'Create a team' })).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/dashboard');
    },
};

export const ValidationError: Story = {
    render: () => <CreateTeamStage errors={{ name: 'The name field is required.' }} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent('The name field is required.');
    },
};
