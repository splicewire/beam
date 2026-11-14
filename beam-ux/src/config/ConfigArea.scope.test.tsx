// @vitest-environment jsdom
// config-sections 10a, amend 2 (root row b1790815): the rail's query is scoped by the transport, as frame's own
// `resourceQueryKey` scopes every frame read. Two frame sockets mount the same resource key on ONE host QueryClient
// over distinct transports; each rail must show only its own sections. Both reviewers' isolation repros, kept as
// written (imports adapted to this module): review-r1 (cs10a-spec-amend-5nJvyj/scope.test.tsx, its amend arm) and
// build-qa (scratch-jjivA1/frozen/beam-ux/src/config/rail-scope.qa.test.tsx).
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it } from 'vitest';
import { createFrameKit } from '@schemastud/frame';
import { createMemoryTransport } from '@schemastud/frame/testing';
import { SectionRail } from './ConfigArea';
import { BEAM_TENANCY, BEAM_UX } from './ConfigArea.fixtures';

afterEach(cleanup);

it('review-r1: isolates rails using the same resource key in two frame sockets on one QueryClient', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first = { ...BEAM_UX, id: 'first.only', root: 'first.only', title: 'First socket section' };
    const second = { ...BEAM_UX, id: 'second.only', root: 'second.only', title: 'Second socket section' };
    const a = createFrameKit({ queryClient: client, transport: createMemoryTransport({ rows: { 'beam-config': [first] } }), urlState: 'memory' });
    const b = createFrameKit({ queryClient: client, transport: createMemoryTransport({ rows: { 'beam-config': [second] } }), urlState: 'memory' });
    render(
        <>
            <div data-testid="first">
                <a.Provider>
                    <SectionRail resource="beam-config" active={null} onPick={() => {}} />
                </a.Provider>
            </div>
            <div data-testid="second">
                <b.Provider>
                    <SectionRail resource="beam-config" active={null} onPick={() => {}} />
                </b.Provider>
            </div>
        </>,
    );
    await waitFor(() => expect(within(screen.getByTestId('first')).getByText('First socket section')).toBeTruthy());
    await waitFor(() =>
        expect(within(screen.getByTestId('second')).queryByText('First socket section') ?? within(screen.getByTestId('second')).queryByText('Second socket section')).not.toBeNull(),
    );
    expect(within(screen.getByTestId('second')).queryByText('Second socket section')).not.toBeNull();
    expect(within(screen.getByTestId('second')).queryByText('First socket section')).toBeNull();
    client.clear();
});

it('build-qa: keeps two mounted sockets separate on a shared host QueryClient', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const row = (title: string) => ({ ...BEAM_TENANCY, title });
    const a = createFrameKit({ queryClient: client, urlState: 'memory', transport: createMemoryTransport({ rows: { 'beam-config': [row('Authority A only')] } }) });
    const b = createFrameKit({ queryClient: client, urlState: 'memory', transport: createMemoryTransport({ rows: { 'beam-config': [row('Authority B only')] } }) });
    const view = render(
        <>
            <div data-testid="A">
                <a.Provider>
                    <SectionRail resource="beam-config" active={null} onPick={() => {}} />
                </a.Provider>
            </div>
            <div data-testid="B">
                <b.Provider>
                    <SectionRail resource="beam-config" active={null} onPick={() => {}} />
                </b.Provider>
            </div>
        </>,
    );
    await waitFor(() => expect(within(view.getByTestId('A')).getByText('Authority A only')).toBeTruthy());
    await waitFor(() => expect(within(view.getByTestId('B')).getByText('Authority B only')).toBeTruthy());
    client.clear();
});
