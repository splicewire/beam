import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAGE_STATE_TABLE } from './page-state.table.js';
import { ForbiddenState, StateBoundary, pageStateOf, retryUnlessClientError, transportOf } from './index.js';

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

describe('<StateBoundary> way-back + ForbiddenState (UX sweep: a refusal was a dead end)', () => {
    const wayBack = { label: 'Back to agents', target: '/agents' };

    it('renders the way-back link in the forbidden state', () => {
        const { container } = render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 403 } }, data: undefined }} label="agents" wayBack={wayBack}>
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('forbidden');
        expect(screen.getByRole('link', { name: 'Back to agents' }).getAttribute('href')).toBe('/agents');
    });

    it('renders the way-back link in the not-found state', () => {
        const { container } = render(
            <StateBoundary query={{ status: 'error', error: { status: 404 }, data: undefined }} label="agents" wayBack={wayBack}>
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('not-found');
        expect(screen.getByText("We couldn't find agents.")).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Back to agents' }).getAttribute('href')).toBe('/agents');
    });

    it('renders the way-back link beside Try again in the error state after a 5xx', () => {
        render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 503 } }, data: undefined }} label="agents" onRetry={vi.fn()} wayBack={wayBack}>
                <p>rows</p>
            </StateBoundary>,
        );
        expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Back to agents' }).getAttribute('href')).toBe('/agents');
    });

    it('renders the way-back link in the error state even for a 4xx that offers no retry', () => {
        render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 405 } }, data: undefined }} label="agents" onRetry={vi.fn()} wayBack={wayBack}>
                <p>rows</p>
            </StateBoundary>,
        );
        expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
        expect(screen.getByRole('link', { name: 'Back to agents' }).getAttribute('href')).toBe('/agents');
    });

    it('renders no way-back link when none is given (it is optional)', () => {
        render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 403 } }, data: undefined }} label="agents">
                <p>rows</p>
            </StateBoundary>,
        );
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('exports ForbiddenState: the forbidden page state as a standalone node, no query needed', () => {
        const { container, rerender } = render(<ForbiddenState label="studio" />);
        expect(container.querySelector('[data-page-state="forbidden"]')).not.toBeNull();
        expect(screen.getByText("You don't have access to studio.")).toBeTruthy();
        expect(screen.getByText('An owner or admin of this workspace can grant it.')).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();

        rerender(<ForbiddenState label="studio" wayBack={{ label: 'Back to Studio', target: '/studio' }} />);
        expect(screen.getByRole('link', { name: 'Back to Studio' }).getAttribute('href')).toBe('/studio');
    });

    it('renders the way-back link in the upsell state so the default plan copy is not a dead end', () => {
        const { container } = render(
            <StateBoundary query={{ status: 'error', error: { response: { status: 402 } }, data: undefined }} label="agents" wayBack={wayBack}>
                <p>rows</p>
            </StateBoundary>,
        );
        expect(container.querySelector('[data-page-state]')?.getAttribute('data-page-state')).toBe('upsell');
        expect(screen.getByText("agents isn't included in this plan.")).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Back to agents' }).getAttribute('href')).toBe('/agents');
    });

    it('renders the way back through a provided render prop (host router) instead of a plain anchor', () => {
        render(
            <StateBoundary
                query={{ status: 'error', error: { response: { status: 403 } }, data: undefined }}
                label="agents"
                wayBack={{
                    label: 'Back to agents',
                    target: '/agents',
                    render: ({ target, className, children }) => (
                        <a href={target} className={className} data-router-link="true">{children}</a>
                    ),
                }}
            >
                <p>rows</p>
            </StateBoundary>,
        );
        const back = screen.getByRole('link', { name: 'Back to agents' });
        expect(back.getAttribute('data-router-link')).toBe('true');
        expect(back.getAttribute('href')).toBe('/agents');
    });
});
