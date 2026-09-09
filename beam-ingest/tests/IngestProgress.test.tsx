import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IngestProgress } from '../src/IngestProgress';
import { IngestProvider } from '../src/provider';
import { pendingRun, runningRun, completedRun, failedRun } from '../src/story-harness';
import type { IngestRunData, IngestServices } from '../src/types';

const clients: QueryClient[] = [];
function mount(run: IngestRunData, services: IngestServices) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    clients.push(queryClient);
    const view = render(
        <QueryClientProvider client={queryClient}>
            <IngestProvider services={services}>
                <IngestProgress run={run} />
            </IngestProvider>
        </QueryClientProvider>,
    );
    return { ...view, queryClient };
}
afterEach(() => {
    cleanup();
    clients.splice(0).forEach((client) => client.clear());
    vi.useRealTimers();
});
describe('portable ingest progress', () => {
    it('calls the injected adapter with the run id and displays server row progress', async () => {
        const get = vi.fn().mockResolvedValue(runningRun);
        mount(pendingRun, { client: { get } });
        expect(screen.getByRole('status').textContent).toContain('Import pending.');
        await waitFor(() =>
            expect(screen.getByRole('status').textContent).toContain('25 of 100 rows.'),
        );
        expect(get).toHaveBeenCalledWith(pendingRun.id);
    });
    it.each([completedRun, failedRun])(
        'does not poll an initially terminal $status run and notifies once',
        async (run) => {
            const get = vi.fn();
            const notify = vi.fn();
            mount(run, { client: { get }, notify });
            await waitFor(() => expect(notify).toHaveBeenCalledWith({ type: 'finished', run }));
            expect(notify).toHaveBeenCalledTimes(1);
            expect(get).not.toHaveBeenCalled();
            if (run.status === 'failed')
                expect(screen.getByRole('alert').textContent).toContain(run.error);
            else expect(screen.getByRole('status').textContent).toContain('Import completed.');
        },
    );
    it('retains a read failure, observes it, and recovers only through Retry', async () => {
        const error = new Error('Network offline');
        const get = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(completedRun);
        const onError = vi.fn();
        const notify = vi.fn();
        mount(pendingRun, { client: { get }, onError, notify });
        await waitFor(() =>
            expect(screen.getByRole('alert').textContent).toContain('Network offline'),
        );
        expect(onError).toHaveBeenCalledWith(error);
        expect(notify).not.toHaveBeenCalled();
        vi.useFakeTimers();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(4500);
        });
        expect(get).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        await waitFor(() =>
            expect(screen.getByRole('status').textContent).toContain('Import completed.'),
        );
        expect(get).toHaveBeenCalledTimes(2);
        expect(notify).toHaveBeenCalledTimes(1);
    });
    it('observes a new run identity without reusing the previous terminal state or notification', async () => {
        const next = { ...pendingRun, id: 'another-ingest' };
        const finishedNext = { ...completedRun, id: next.id };
        const get = vi.fn().mockResolvedValue(finishedNext);
        const notify = vi.fn();
        const services = { client: { get }, notify };
        const view = mount(completedRun, services);
        await waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
        view.rerender(
            <QueryClientProvider client={view.queryClient}>
                <IngestProvider services={services}>
                    <IngestProgress run={next} />
                </IngestProvider>
            </QueryClientProvider>,
        );
        await waitFor(() => expect(notify).toHaveBeenCalledTimes(2));
        expect(get).toHaveBeenCalledWith(next.id);
        expect(notify.mock.calls.map(([event]) => event.run.id)).toEqual([
            completedRun.id,
            next.id,
        ]);
    });
    it('polls an active run and stops after its server terminal response', async () => {
        const get = vi.fn().mockResolvedValueOnce(runningRun).mockResolvedValue(completedRun);
        const notify = vi.fn();
        mount(pendingRun, { client: { get }, notify });
        await waitFor(() =>
            expect(screen.getByRole('status').textContent).toContain('Import running.'),
        );
        await waitFor(
            () => expect(screen.getByRole('status').textContent).toContain('Import completed.'),
            { timeout: 2500 },
        );
        expect(get).toHaveBeenCalledTimes(2);
        vi.useFakeTimers();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(4500);
        });
        expect(get).toHaveBeenCalledTimes(2);
        expect(notify).toHaveBeenCalledTimes(1);
    });
});

it('disables Retry while the manual progress read is in flight', async () => {
    let resolve: (value: IngestRunData) => void = () => {};
    const waiting = new Promise<IngestRunData>((done) => {
        resolve = done;
    });
    const get = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporarily unavailable'))
        .mockReturnValue(waiting);
    mount(pendingRun, { client: { get } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Checking…' }).hasAttribute('disabled')).toBe(
            true,
        ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Checking…' }));
    expect(get).toHaveBeenCalledTimes(2);
    resolve(completedRun);
    await waitFor(() =>
        expect(screen.getByRole('status').textContent).toContain('Import completed.'),
    );
});
