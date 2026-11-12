import { router, usePage } from '@inertiajs/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useEffect, useState } from 'react';
import CreateTeam from './account/create-team';
import AcceptInvitation from './auth/accept-invitation';
import { createFrameKit, type FrameManifest } from '@schemastud/frame';
import { createMemoryTransport, type MemoryTransportFixtures } from '@schemastud/frame/testing';
import { setStubPage } from '../story-harness';

// The selected team's manifest, served from memory. A team change resets every `['frame', …]`
// query, which is the kit's manifest entry, so the next read sees whatever this fixture holds then.
const manifestFixture: MemoryTransportFixtures = {};
const teamKit = createFrameKit({ transport: createMemoryTransport(manifestFixture) });
const TEAMLESS: FrameManifest = { resources: [], contexts: {} };
const JOINED: FrameManifest = {
    resources: [{
        key: 'requests', data: 'App.Data.RequestData', editData: null, createResultData: null,
        form: 'enriched', nav: { label: 'Requests' },
    }],
    contexts: {},
};

function Readiness() {
    const { data } = teamKit.useManifest();
    return <p role="status">{data?.resources.length ? 'Shared requests available' : 'No team resources'}</p>;
}

/** Actual page callbacks and manifest hook, with a disposable local Inertia/server boundary. */
function Stage({ accept = false, refused = false }: { accept?: boolean; refused?: boolean }) {
    const [client, setClient] = useState<QueryClient | null>(null);
    const page = usePage();
    setStubPage(accept ? {
        state: 'ready', teamName: 'Service desk', email: 'member@example.test', role: 'member',
        viewerEmail: 'member@example.test', acceptUrl: '/invitations/fixture/redeem',
    } : { action: '/teams/create', cancelUrl: '/dashboard' });
    useEffect(() => {
        const originalPost = router.post;
        manifestFixture.manifest = TEAMLESS;
        const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        router.post = (_url, _data, options) => {
            if (refused) {
                options?.onError?.({ name: 'Refused', invitation: 'Refused' });
                return;
            }
            manifestFixture.manifest = JOINED;
            void options?.onSuccess?.(page);
        };
        setClient(cache);
        return () => { router.post = originalPost; cache.clear(); };
    }, [accept, refused]);
    return client ? <QueryClientProvider client={client}>
        <div className="max-w-lg space-y-6"><Readiness />{accept ? <AcceptInvitation /> : <CreateTeam />}</div>
    </QueryClientProvider> : null;
}
const meta = { title: 'Inertia/Account/Team transition', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj;
export const CreateRefreshesManifest: Story = {
    render: () => <Stage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('status')).toHaveTextContent('No team resources');
        await userEvent.type(canvas.getByLabelText('Team name'), 'Service desk');
        await userEvent.click(canvas.getByRole('button', { name: /^Create team$/ }));
        await expect(await canvas.findByRole('status')).toHaveTextContent('Shared requests available');
    },
};
export const AcceptRefreshesManifest: Story = {
    render: () => <Stage accept />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('status')).toHaveTextContent('No team resources');
        await userEvent.click(await canvas.findByRole('button', { name: 'Accept invitation' }));
        await expect(await canvas.findByRole('status')).toHaveTextContent('Shared requests available');
    },
};
export const RefusalPreservesManifest: Story = {
    render: () => <Stage accept refused />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: 'Accept invitation' }));
        await expect(canvas.getByRole('status')).toHaveTextContent('No team resources');
    },
};
