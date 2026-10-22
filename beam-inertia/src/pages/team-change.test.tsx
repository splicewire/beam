// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import CreateTeam from './account/create-team';
import AcceptInvitation from './auth/accept-invitation';

const state = vi.hoisted(() => ({
    props: {} as Record<string, unknown>,
    post: vi.fn(),
}));
vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => ({ props: state.props }),
    router: { post: state.post },
}));
// Exercise the actual adapters/callbacks; package form details have their own coverage.
vi.mock('@splicewire/beam-accounts', () => ({
    CreateTeamForm: ({ onSubmit }: { onSubmit: (input: { name: string }) => void }) =>
        <button onClick={() => onSubmit({ name: 'Next team' })}>Create team</button>,
    AcceptInvitationPanel: ({ onAccept }: { onAccept?: () => void }) =>
        <button onClick={onAccept}>Accept invitation</button>,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

for (const kind of ['create', 'accept'] as const) {
    for (const success of [true, false]) {
        it(`${kind} ${success ? 'success refreshes selected-team queries' : 'failure preserves cache'}`, async () => {
            const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } });
            const manifestKey = ['frame', 'manifest', 'tenant'];
            client.setQueryData(manifestKey, 'teamless');
            client.setQueryData(['frame', 'requests', 'list', {}, '/frame'], ['previous team']);
            client.setQueryData(['frame', 'requests', 'record', '1', '/frame'], 'previous record');
            client.setQueryData(['saved-filters', 'requests', null, '/frame'], ['old filter']);
            client.setQueryData(['unrelated-profile'], 'retained');
            let selected = false;
            const fetchManifest = vi.fn(async () => selected ? 'joined team' : 'teamless');
            function Manifest() {
                const { data } = useQuery({ queryKey: manifestKey, queryFn: fetchManifest });
                return <p>{data}</p>;
            }
            state.props = kind === 'create'
                ? { action: '/teams/create', cancelUrl: null }
                : { state: 'ready', acceptUrl: '/invitations/fixture/redeem', viewerEmail: 'member@example.test' };
            state.post.mockImplementation((_url, _input, options) => {
                selected = success;
                return success ? options.onSuccess?.() : options.onError?.({ name: 'Refused' });
            });
            render(<QueryClientProvider client={client}>
                <Manifest />{kind === 'create' ? <CreateTeam /> : <AcceptInvitation />}
            </QueryClientProvider>);
            expect(screen.getByText('teamless')).toBeTruthy();
            fireEvent.click(screen.getByRole('button'));
            expect(state.post).toHaveBeenCalledOnce();
            if (success) {
                await waitFor(() => expect(screen.getByText('joined team')).toBeTruthy());
                expect(fetchManifest).toHaveBeenCalledOnce();
                expect(client.getQueryData(['frame', 'requests', 'list', {}, '/frame'])).toBeUndefined();
                expect(client.getQueryData(['frame', 'requests', 'record', '1', '/frame'])).toBeUndefined();
                expect(client.getQueryData(['saved-filters', 'requests', null, '/frame'])).toBeUndefined();
            } else {
                expect(fetchManifest).not.toHaveBeenCalled();
                expect(client.getQueryData(manifestKey)).toBe('teamless');
                expect(client.getQueryData(['frame', 'requests', 'record', '1', '/frame'])).toBe('previous record');
            }
            expect(client.getQueryData(['unrelated-profile'])).toBe('retained');
            client.clear();
        });
    }
}
