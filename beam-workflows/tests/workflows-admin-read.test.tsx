import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { WorkflowLineageData } from '@splicewire/_resources/types/workflows';
import { WorkflowsAdminPage } from '../src/WorkflowsAdminPage';
import { WorkflowsProvider } from '../src/provider';
import { makeMockClient } from '../src/story-harness';
import { catalog, lineages } from '../src/story-fixtures';
import type { WorkflowsClient } from '../src/types';

afterEach(cleanup);
beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});
function mount(client: WorkflowsClient, selected = vi.fn()) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
        <QueryClientProvider client={qc}>
            <WorkflowsProvider services={{ client, onSelectLineage: selected }}>
                <WorkflowsAdminPage />
            </WorkflowsProvider>
        </QueryClientProvider>,
    );
    return qc;
}
function readClient() {
    const client = makeMockClient({ catalog: { ...catalog, canAuthor: false } });
    client.saveVersion = vi.fn(client.saveVersion);
    client.bind = vi.fn(client.bind);
    client.unbind = vi.fn(client.unbind);
    client.migrate = vi.fn(client.migrate);
    return client;
}
function noWrites(client: WorkflowsClient) {
    for (const call of [client.saveVersion, client.bind, client.unbind, client.migrate]) {
        expect(call).not.toHaveBeenCalled();
    }
}
it.each([
    ['403 fetch refusal', Object.assign(new Error('Sensitive server detail'), { status: 403 }), 'forbidden', false],
    ['401 axios refusal', Object.assign(new Error('Sensitive authentication detail'), { response: { status: 401 } }), 'forbidden', false],
    ['403 axios refusal', Object.assign(new Error('Sensitive server detail'), { response: { status: 403 } }), 'forbidden', false],
    ['401 fetch refusal', Object.assign(new Error('Sensitive authentication detail'), { status: 401 }), 'forbidden', false],
    ['network failure', new TypeError('Failed to fetch: secret transport URL'), 'error', true],
    ['500 fetch failure', Object.assign(new Error('SQLSTATE private stack'), { status: 500 }), 'error', true],
    ['500 response takes precedence', Object.assign(new Error('SQLSTATE private stack'), { response: { status: 500 }, status: 403 }), 'error', true],
    ['422 client failure', Object.assign(new Error('Private validation detail'), { status: 422 }), 'error', false],
])('distinguishes %s from empty with the family state marker and safe copy', async (_label, error, state, retry) => {
    const client = readClient();
    client.listLineages = vi.fn(async () => { throw error; });
    mount(client);
    const alert = await screen.findByRole('alert');
    expect(alert.closest('[data-page-state]')?.getAttribute('data-page-state')).toBe(state);
    expect(alert.textContent).toContain(state === 'forbidden' ? "You don't have access to workflows." : 'Could not load workflows.');
    expect(alert.textContent).not.toContain(error.message);
    expect(screen.queryByText('No workflows match.')).toBeNull();
    expect(Boolean(screen.queryByRole('button', { name: 'Retry' }))).toBe(retry);
    noWrites(client);
});
it('shows loading without an empty or failure claim while the transport is pending', async () => {
    const client = readClient();
    client.listLineages = vi.fn(() => new Promise<WorkflowLineageData[]>(() => {}));
    mount(client);
    expect((await screen.findByText('Loading…')).closest('[data-page-state]')?.getAttribute('data-page-state')).toBe('loading');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('No workflows match.')).toBeNull();
});
it('reserves the empty message for a successful empty response', async () => {
    const client = readClient();
    client.listLineages = vi.fn(async () => []);
    mount(client);
    expect((await screen.findByText('No workflows match.')).closest('[data-page-state]')?.getAttribute('data-page-state')).toBe('empty');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});
it('retains the populated success state', async () => {
    const client = readClient();
    mount(client);
    expect((await screen.findByRole('button', { name: new RegExp(lineages[0].name) })).closest('[data-page-state]')?.getAttribute('data-page-state')).toBe('ready');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('No workflows match.')).toBeNull();
});
it.each(['populated', 'empty'])('retries the actual read transport into %s without writes', async (result) => {
    const user = userEvent.setup();
    const client = readClient();
    let complete: (value: WorkflowLineageData[]) => void = () => { throw new Error('Retry was not started'); };
    client.listLineages = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
        .mockImplementationOnce(() => new Promise<WorkflowLineageData[]>((resolve) => { complete = resolve; }));
    mount(client);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(client.listLineages).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('No workflows match.')).toBeNull();
    complete(result === 'empty' ? [] : lineages);
    if (result === 'empty') expect(await screen.findByText('No workflows match.')).toBeTruthy();
    else expect(await screen.findByRole('button', { name: new RegExp(lineages[0].name) })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    noWrites(client);
});
it('does not present cached selection as current success after a refused refetch; retry restores selection', async () => {
    const user = userEvent.setup();
    const client = readClient();
    client.listLineages = vi.fn().mockResolvedValueOnce(lineages)
        .mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }))
        .mockResolvedValueOnce(lineages);
    const selected = vi.fn();
    const qc = mount(client, selected);
    await user.click(await screen.findByRole('button', { name: new RegExp(lineages[0].name) }));
    await waitFor(() => expect(selected).toHaveBeenLastCalledWith(lineages[0]));
    await qc.refetchQueries({ queryKey: ['beam-workflows', 'lineages'] });
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: new RegExp(lineages[0].name) })).toBeNull();
    expect(screen.queryByRole('button', { name: /Save as new version/ })).toBeNull();
    expect(screen.queryByText('No workflows match.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    await qc.refetchQueries({ queryKey: ['beam-workflows', 'lineages'] });
    await waitFor(() => expect(selected).toHaveBeenLastCalledWith(lineages[0]));
    expect(client.listLineages).toHaveBeenCalledTimes(3);
    noWrites(client);
});

it('shows forbidden without Retry when a server-error retry is then refused', async () => {
    const user = userEvent.setup();
    const client = readClient();
    client.listLineages = vi.fn().mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
        .mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }));
    mount(client);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(client.listLineages).toHaveBeenCalledTimes(2));
    const alert = await screen.findByRole('alert');
    expect(alert.closest('[data-page-state]')?.getAttribute('data-page-state')).toBe('forbidden');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(screen.queryByText('No workflows match.')).toBeNull();
    noWrites(client);
});
