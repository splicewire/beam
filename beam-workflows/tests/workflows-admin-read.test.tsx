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
    ['403 refusal', Object.assign(new Error('Sensitive server detail'), { status: 403 })],
    ['network failure', new TypeError('Failed to fetch: secret transport URL')],
    ['server failure', Object.assign(new Error('SQLSTATE private stack'), { status: 500 })],
])('distinguishes %s from a successful empty read without exposing internals', async (_label, error) => {
    const client = readClient();
    client.listLineages = vi.fn(async () => { throw error; });
    mount(client);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load workflows.');
    expect(alert.textContent).not.toContain(error.message);
    expect(screen.queryByText('No workflows match.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    noWrites(client);
});
it('shows loading without an empty or failure claim while the transport is pending', async () => {
    const client = readClient();
    client.listLineages = vi.fn(() => new Promise<WorkflowLineageData[]>(() => {}));
    mount(client);
    expect(await screen.findByText('Loading…')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('No workflows match.')).toBeNull();
});
it('reserves the empty message for a successful empty response', async () => {
    const client = readClient();
    client.listLineages = vi.fn(async () => []);
    mount(client);
    expect(await screen.findByText('No workflows match.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});
it('retains the populated success state', async () => {
    const client = readClient();
    mount(client);
    expect(await screen.findByRole('button', { name: new RegExp(lineages[0].name) })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('No workflows match.')).toBeNull();
});
it.each(['populated', 'empty'])('retries the actual read transport into %s without writes', async (result) => {
    const user = userEvent.setup();
    const client = readClient();
    let complete: (value: WorkflowLineageData[]) => void = () => { throw new Error('Retry was not started'); };
    client.listLineages = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }))
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
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(selected).toHaveBeenLastCalledWith(lineages[0]));
    expect(client.listLineages).toHaveBeenCalledTimes(3);
    noWrites(client);
});

it('keeps a repeated refusal as an error after Retry without empty success or writes', async () => {
    const user = userEvent.setup();
    const client = readClient();
    client.listLineages = vi.fn(async () => { throw Object.assign(new Error('Forbidden'), { status: 403 }); });
    mount(client);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(client.listLineages).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('No workflows match.')).toBeNull();
    noWrites(client);
});
