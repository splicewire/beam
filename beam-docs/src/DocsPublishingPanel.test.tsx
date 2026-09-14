import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocsPublishingPanel } from './DocsPublishingPanel.js';
import type { DocsTransport, PublicationData } from './publications.js';

function attempt(overrides: Partial<PublicationData> = {}): PublicationData {
    return {
        id: 'release-1', version: 'v1.0.0', status: 'queued', sha256: 'a'.repeat(64),
        namespace: 'beam', slug: 'api', isPrivate: true, registryUrl: null, error: null,
        createdAt: '2026-09-14T12:00:00Z', startedAt: null, finishedAt: null, retryOf: null,
        ...overrides,
    };
}

afterEach(() => vi.useRealTimers());

describe('DocsPublishingPanel', () => {
    it('publishes only a version, then polls queued and running attempts until success', async () => {
        const row = attempt();
        const transport = vi.fn<DocsTransport>()
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: row })
            .mockResolvedValueOnce({ data: { ...row, status: 'running' } })
            .mockResolvedValueOnce({ data: { ...row, status: 'succeeded', registryUrl: 'https://registry.scalar.com/@beam/apis/api/1.0.0' } });
        render(<DocsPublishingPanel transport={transport} pollIntervalMs={250} />);
        await screen.findByText(/No releases have been published/);
        vi.useFakeTimers();
        fireEvent.change(screen.getByRole('textbox', { name: /Release version/ }), { target: { value: ' v1.0.0 ' } });
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Publish release' })));
        expect(transport.mock.calls[1][0]).toBe('/beam/docs/publications');
        expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toEqual({ version: 'v1.0.0' });
        expect(screen.getByText('queued')).toBeTruthy();
        await act(async () => vi.advanceTimersByTimeAsync(250));
        expect(screen.getByText('running')).toBeTruthy();
        expect(transport.mock.calls[2][0]).toBe('/beam/docs/publications/release-1');
        await act(async () => vi.advanceTimersByTimeAsync(250));
        expect(screen.getByText('succeeded')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'View in Scalar Registry' }).getAttribute('href'))
            .toBe('https://registry.scalar.com/@beam/apis/api/1.0.0');
        const calls = transport.mock.calls.length;
        await act(async () => vi.advanceTimersByTimeAsync(2000));
        expect(transport).toHaveBeenCalledTimes(calls);
    });

    it('retries the failed attempt by id and retains the previous successful publication', async () => {
        const success = attempt({ id: 'previous', status: 'succeeded', version: 'v0.9.0',
            registryUrl: 'https://registry.scalar.com/@beam/apis/api/0.9.0', createdAt: '2026-09-13T12:00:00Z' });
        const failure = attempt({ status: 'failed', error: 'Registry rejected this version.' });
        const retry = attempt({ id: 'retry-2', retryOf: failure.id, createdAt: '2026-09-14T12:01:00Z' });
        const transport = vi.fn<DocsTransport>()
            .mockResolvedValueOnce({ data: [success, failure] })
            .mockResolvedValueOnce({ data: retry });
        const { container } = render(<DocsPublishingPanel transport={transport} />);
        await screen.findByText('Registry rejected this version.');
        fireEvent.click(screen.getByRole('button', { name: 'Retry v1.0.0' }));
        await waitFor(() => expect(container.querySelector('[data-publication-id="retry-2"]')).not.toBeNull());
        expect(transport.mock.calls[1][0]).toBe('/beam/docs/publications/release-1/retry');
        expect(transport.mock.calls[1][1]?.method).toBe('POST');
        expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toEqual({});
        expect(screen.getByRole('link', { name: 'View in Scalar Registry' }).getAttribute('href')).toContain('/0.9.0');
        const ids = [...container.querySelectorAll('[data-publication-id]')].map((element) => element.getAttribute('data-publication-id'));
        expect(ids).toEqual(['retry-2', 'release-1', 'previous']);
    });

    it('offers a recoverable error without showing arbitrary transport exception contents', async () => {
        const transport = vi.fn<DocsTransport>()
            .mockRejectedValueOnce(new Error('Authorization: Bearer secret-do-not-render'))
            .mockResolvedValueOnce({ data: [] });
        render(<DocsPublishingPanel transport={transport} />);
        await screen.findByRole('alert');
        expect(document.body.textContent).not.toContain('secret-do-not-render');
        fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
        await screen.findByText(/No releases have been published/);
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('does not link failed attempts or unsafe Registry URLs and renders server errors as text', async () => {
        const transport = vi.fn<DocsTransport>().mockResolvedValue({ data: [
            attempt({ id: 'failed', status: 'failed', error: '<script>doNotRun()</script>', registryUrl: 'https://registry.scalar.com/@beam/apis/api/1' }),
            attempt({ id: 'unsafe', status: 'succeeded', registryUrl: 'https://registry.scalar.com.attacker.example/phish' }),
        ] });
        const { container } = render(<DocsPublishingPanel transport={transport} />);
        await screen.findByText('<script>doNotRun()</script>');
        expect(container.querySelector('script')).toBeNull();
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('ignores a stale list that arrives after a new publication and prevents duplicate submissions', async () => {
        let finishList!: (value: unknown) => void;
        let finishPublish!: (value: unknown) => void;
        const transport = vi.fn<DocsTransport>()
            .mockImplementationOnce(() => new Promise((resolve) => { finishList = resolve; }))
            .mockImplementationOnce(() => new Promise((resolve) => { finishPublish = resolve; }));
        const { container } = render(<DocsPublishingPanel transport={transport} />);
        fireEvent.change(screen.getByRole('textbox', { name: /Release version/ }), { target: { value: 'v1.0.0' } });
        fireEvent.click(screen.getByRole('button', { name: 'Publish release' }));
        fireEvent.submit(container.querySelector('form')!);
        expect(transport).toHaveBeenCalledTimes(2);
        await act(async () => finishPublish({ data: attempt({ status: 'succeeded' }) }));
        await act(async () => finishList({ data: [attempt()] }));
        expect(within(screen.getByRole('list', { name: 'Publication attempts' })).getByText('succeeded')).toBeTruthy();
        expect(screen.queryByText('queued')).toBeNull();
    });

    it('clears the previous endpoint’s attempts when the host changes the endpoint', async () => {
        const transport = vi.fn<DocsTransport>().mockResolvedValueOnce({ data: [attempt({ status: 'succeeded' })] })
            .mockResolvedValueOnce({ data: [] });
        const { rerender } = render(<DocsPublishingPanel endpoint="/first/publications" transport={transport} />);
        await screen.findByText('v1.0.0');
        rerender(<DocsPublishingPanel endpoint="/second/publications" transport={transport} />);
        await screen.findByText(/No releases have been published/);
        expect(screen.queryByText('v1.0.0')).toBeNull();
    });

    it('validates the generated release schema before submitting to the server', async () => {
        const transport = vi.fn<DocsTransport>().mockResolvedValue({ data: [] });
        render(<DocsPublishingPanel transport={transport} />);
        await screen.findByText(/No releases have been published/);
        const input = screen.getByRole('textbox', { name: /Release version/ });
        fireEvent.change(input, { target: { value: 'bad release' } });
        fireEvent.click(screen.getByRole('button', { name: 'Publish release' }));
        await screen.findByText('Enter a release version such as v1.2.3 or 1.2.3+build.4.');
        expect(transport).toHaveBeenCalledTimes(1);

        fireEvent.change(input, { target: { value: 'a'.repeat(129) } });
        fireEvent.click(screen.getByRole('button', { name: 'Publish release' }));
        await screen.findByText(/must NOT have more than 128 characters/);
        expect(transport).toHaveBeenCalledTimes(1);
    });
});
