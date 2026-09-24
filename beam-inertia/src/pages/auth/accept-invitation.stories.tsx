import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage } from '../../story-harness';

/**
 * Auth / Accept invitation — the packaged `auth/accept-invitation` page (`invitations.accept`, the
 * emailed link), resolved through the public `resolveBeamPage` seam. The server decides the state;
 * the page renders `@splicewire/beam-accounts`' <AcceptInvitationPanel> for it.
 */
const base = {
    teamName: 'Acme Design',
    email: 'ivy@example.test',
    role: 'admin',
    inviterName: 'Olive Owner',
    expiresAt: '2026-10-01T00:00:00+00:00',
    viewerEmail: null as string | null,
    acceptUrl: null as string | null,
    registerUrl: '/register?email=ivy%40example.test',
    loginUrl: '/login',
    logoutUrl: '/logout',
    errors: {},
};

function AcceptStage(props: Partial<typeof base> & { state: string }) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({ ...base, ...props });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/accept-invitation').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Auth/AcceptInvitation',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-sm">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Guest: Story = {
    render: () => <AcceptStage state="guest" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('link', { name: 'Create account' })).toBeInTheDocument();
    },
};

export const Ready: Story = {
    render: () => (
        <AcceptStage state="ready" viewerEmail="ivy@example.test" acceptUrl="/invitations/abc/redeem" />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: 'Accept invitation' })).toBeEnabled();
    },
};

export const WrongAccount: Story = {
    render: () => <AcceptStage state="wrong-account" viewerEmail="someone-else@example.test" />,
};

export const Expired: Story = {
    render: () => <AcceptStage state="expired" viewerEmail="ivy@example.test" />,
};

export const Invalid: Story = {
    render: () => (
        <AcceptStage state="invalid" teamName={undefined} email={undefined} role={undefined} inviterName={undefined} />
    ),
};
