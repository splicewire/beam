import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAGE_STATE_TABLE } from './page-state.table.js';
import { StateBoundary, pageStateOf, retryUnlessClientError, transportOf } from './index.js';

describe('pageStateOf: one mapping from the transport to a page state (APP-8)', () => {
    it.each(PAGE_STATE_TABLE)('$name', ({ transport, outcome }) => {
        expect(pageStateOf(transport)).toEqual(outcome);
    });

    it('never retries a 4xx and never reads a failed read as empty or ready', () => {
        for (const { transport } of PAGE_STATE_TABLE) {
            const { state, retry } = pageStateOf(transport);
            if (transport.phase === 'answered' && transport.status >= 400 && transport.status < 500) {
                expect(retry).toBe('never');
            }
            if (transport.phase === 'network-error' || (transport.phase === 'answered' && transport.status >= 400)) {
                expect(['empty', 'ready']).not.toContain(state);
            }
        }
    });
});

describe('transportOf: a query read as the transport saw it', () => {
    it('reads a pending query as in flight', () => {
        expect(transportOf({ status: 'pending', error: null, data: undefined })).toEqual({ phase: 'in-flight' });
    });

    it('reads the HTTP status off a failed query, axios- or fetch-shaped', () => {
        expect(transportOf({ status: 'error', error: { response: { status: 403 } }, data: undefined })).toEqual({ phase: 'answered', status: 403 });
        expect(transportOf({ status: 'error', error: { status: 404 }, data: undefined })).toEqual({ phase: 'answered', status: 404 });
        expect(transportOf({ status: 'error', error: new Error('offline'), data: undefined })).toEqual({ phase: 'network-error' });
    });

    it('counts rows on a list, and passes the filter flag through', () => {
        expect(transportOf({ status: 'success', error: null, data: [] }, { filtered: true })).toEqual({ phase: 'answered', status: 200, rows: 0, filtered: true });
        expect(transportOf({ status: 'success', error: null, data: { data: [1, 2] } })).toEqual({ phase: 'answered', status: 200, rows: 2 });
        expect(transportOf({ status: 'success', error: null, data: { id: 1 } })).toEqual({ phase: 'answered', status: 200 });
    });
});

describe('retryUnlessClientError: the QueryClient default', () => {
    it('never retries a 4xx', () => {
        expect(retryUnlessClientError(0, { response: { status: 403 } })).toBe(false);
        expect(retryUnlessClientError(0, { status: 422 })).toBe(false);
    });

    it('retries a 5xx or a network failure once, then stops', () => {
        expect(retryUnlessClientError(0, { response: { status: 503 } })).toBe(true);
        expect(retryUnlessClientError(1, { response: { status: 503 } })).toBe(false);
        expect(retryUnlessClientError(0, new Error('offline'))).toBe(true);
    });
});

describe('<StateBoundary>', () => {
    it('marks the region with its state and renders the children only when ready or empty', () => {
        const { container, rerender } = render(
            <StateBoundary query={{ status: 'success', error: null, data: [1] }} label="agents">
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('ready');
        expect(screen.getByText('rows')).toBeTruthy();

        rerender(
            <StateBoundary query={{ status: 'pending', error: null, data: undefined }} label="agents">
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('loading');
        expect(screen.queryByText('rows')).toBeNull();
    });

    it('says forbidden for a 403, names the object, and offers no Try again', () => {
        const { container } = render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 403 } }, data: undefined }} label="agents" onRetry={vi.fn()}>
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('forbidden');
        expect(container.textContent).toMatch(/agents/i);
        expect(container.textContent).not.toMatch(/Try again/);
        expect(screen.queryByText('rows')).toBeNull();
    });

    it('offers Try again only after a 5xx or a network failure', () => {
        const onRetry = vi.fn();
        render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 500 } }, data: undefined }} label="agents" onRetry={onRetry}>
                <p>rows</p>
            </StateBoundary>,
        );
        screen.getByRole('button', { name: 'Try again' }).click();
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('shows the server message for a 422', () => {
        const { container } = render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 422, data: { message: 'The window is invalid.' } } }, data: undefined }} label="calendar">
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('error');
        expect(container.textContent).toContain('The window is invalid.');
    });
});
