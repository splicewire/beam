import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ report: vi.fn() }));
vi.mock('@splicewire/beam-ux/site', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    reportEvent: h.report,
}));

import { configureDocs } from './configure.js';
import { DocsSearch } from './DocsSearch.js';

/**
 * EP-29 follow-on (an-0237 d8; launch EP29-FOLLOWON-PLAN.md ruling 2): the docs search reports GA4 `search` when the reader
 * COMMITS to a term (Enter, following a result, or arriving with `?q=`), once per distinct term. It searches as you type,
 * so reporting every settled query would count "a", "ap" and "app" as three searches.
 */
beforeEach(() => {
    vi.useFakeTimers();
    h.report.mockReset();
    configureDocs({
        transport: async () => ({ data: { results: [{ href: '/docs/guide', title: 'Guide', kind: 'page', trail: [], excerpt: null }], fallback: null } }),
    });
    window.history.replaceState(null, '', '/docs/guide');
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

const type = async (value: string) => {
    fireEvent.change(screen.getByLabelText('Search docs'), { target: { value } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
};
const searches = () => h.report.mock.calls.filter(([name]) => name === 'search').map(([, params]) => params);

describe('DocsSearch analytics', () => {
    it('reports nothing while the reader is only typing', async () => {
        render(<DocsSearch root="/docs" />);
        await type('a');
        await type('ap');
        await type('app');

        expect(searches()).toEqual([]);
    });

    it('reports the term on Enter, once per distinct term', async () => {
        render(<DocsSearch root="/docs" />);
        await type('app');
        fireEvent.keyDown(screen.getByLabelText('Search docs'), { key: 'Enter' });
        fireEvent.keyDown(screen.getByLabelText('Search docs'), { key: 'Enter' });
        await type('apps ');
        fireEvent.keyDown(screen.getByLabelText('Search docs'), { key: 'Enter' });

        expect(searches()).toEqual([{ search_term: 'app' }, { search_term: 'apps' }]);
    });

    it('reports the term when the reader follows a result, not again after Enter', async () => {
        render(<DocsSearch root="/docs" />);
        await type('guide');
        fireEvent.click(screen.getByRole('option', { name: /Guide/ }));
        fireEvent.keyDown(screen.getByLabelText('Search docs'), { key: 'Enter' });

        expect(searches()).toEqual([{ search_term: 'guide' }]);
    });

    it('reports a term the reader arrived with in ?q=', async () => {
        window.history.replaceState(null, '', '/docs/guide?q=install');
        render(<DocsSearch root="/docs" />);
        await act(async () => { await vi.advanceTimersByTimeAsync(300); });

        expect(searches()).toEqual([{ search_term: 'install' }]);
    });
});
