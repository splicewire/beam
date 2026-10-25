import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewBar, PreviewBoundary, type PreviewBarData } from './PreviewBar.js';

// ADR-0232 d10, d11, d13 (EP-18): the bar lists what the Release changes and what would stop Publish, and switches
// the same URL between the Preview and the live site.
const base: PreviewBarData = {
    label: 'Spring release',
    exitUrl: '/_beam/preview/exit',
    mode: 'preview',
    switchUrl: '/_beam/preview/switch?to=live&path=%2Fabout',
    previewUrl: '/_beam/preview/switch?to=preview',
    changes: {
        pages: [{ entryId: 'about', title: 'About', path: '/about', recordPage: false }],
        reach: [
            {
                entryId: 'card', name: 'Card', kind: 'component', everyPage: false, count: 2,
                pages: [
                    { entryId: 'home', title: 'Home', path: '/', recordPage: false },
                    { entryId: 'post', title: 'Post', path: '/posts/{slug}', recordPage: true },
                ],
            },
            { entryId: 'theme', name: 'default', kind: 'theme', everyPage: true, count: 9, pages: [] },
        ],
    },
    recordChoices: { post: [{ label: 'Hello', path: '/posts/hello' }] },
    readiness: {
        ready: false,
        blockers: [{ code: 'stale', entryId: 'about', message: 'A publication pin or marking moved. Rebase or drop that member.', fixes: ['rebase', 'drop'] }],
        notes: [{ code: 'other-release', entryId: 'about', message: 'Also in the Release "Summer" (scheduled).', fixes: [], releaseDueAt: '2030-01-01T09:30:00+01:00' }],
    },
};

describe('PreviewBar (Release)', () => {
    it('lists the changed pages first, then each member\'s reach with a count, and every page under a theme', () => {
        render(<PreviewBar preview={base} />);

        const changes = screen.getByRole('region', { name: 'Changed pages' });
        expect(within(changes).getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about');
        expect(within(changes).getByText('Card — 2 pages')).toBeTruthy();
        expect(within(changes).getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
        expect(within(changes).getByText('default — every page')).toBeTruthy();
    });

    it('opens a Record Page on a Record the viewer may read', () => {
        render(<PreviewBar preview={base} />);

        const changes = screen.getByRole('region', { name: 'Changed pages' });
        expect(within(changes).queryByRole('link', { name: 'Post' })).toBeNull();
        expect(within(changes).getByRole('link', { name: 'Post: Hello' }).getAttribute('href')).toBe('/posts/hello');
    });

    it('says what would stop Publish, and the notes that would not', () => {
        render(<PreviewBar preview={base} />);

        const readiness = screen.getByRole('region', { name: 'Publish' });
        expect(within(readiness).getByText('1 thing stops Publish')).toBeTruthy();
        expect(within(readiness).getByText(/A publication pin or marking moved/)).toBeTruthy();
        expect(within(readiness).getByText('Fix: rebase or drop')).toBeTruthy();
        expect(within(readiness).getByText(/Also in the Release "Summer"/)).toBeTruthy();

        render(<PreviewBar preview={{ ...base, readiness: { ready: true, blockers: [], notes: [] } }} />);
        expect(screen.getByText('Nothing stops Publish')).toBeTruthy();
    });

    it('links each fix to where it is pressed: the Release\'s page, or the page itself', () => {
        render(<PreviewBar preview={{
            ...base,
            releaseHref: '/operator/releases/r1',
            readiness: {
                ready: false,
                blockers: [
                    { code: 'stale', entryId: 'about', message: 'A publication pin moved.', fixes: ['rebase', 'drop'] },
                    { code: 'content', entryId: 'about', message: 'The body is refused.', fixes: ['open', 'drop'] },
                ],
                notes: [],
            },
        }} />);

        const readiness = screen.getByRole('region', { name: 'Publish' });
        expect(within(readiness).getAllByRole('link', { name: 'Fix in the Release' }).map((a) => a.getAttribute('href')))
            .toEqual(['/operator/releases/r1', '/operator/releases/r1']);
        expect(within(readiness).getByRole('link', { name: 'Open the page' }).getAttribute('href')).toBe('/about');
    });

    it('links the fix to the member\'s page where the host mounts no Release page (orch-lead ruling A)', () => {
        // A starter has no Frame Release page; the author fixes a member in the page editor's Release panel.
        render(<PreviewBar preview={{
            ...base,
            mode: 'live',
            releaseHref: null,
            readiness: {
                ready: false,
                blockers: [{ code: 'stale', entryId: 'about', message: 'A publication pin moved.', fixes: ['rebase', 'drop'] }],
                notes: [],
            },
        }} />);

        const readiness = screen.getByRole('region', { name: 'Publish' });
        expect(within(readiness).queryByRole('link', { name: 'Fix in the Release' })).toBeNull();
        expect(within(readiness).getByRole('link', { name: 'Fix on the page' }).getAttribute('href'))
            .toBe('/_beam/preview/switch?to=preview&path=%2Fabout');
    });

    it('switches this URL to the live site, and from the live site links back into the Preview', () => {
        const { rerender } = render(<PreviewBar preview={base} />);
        expect(screen.getByRole('link', { name: 'Live site' }).getAttribute('href')).toBe('/_beam/preview/switch?to=live&path=%2Fabout');

        rerender(<PreviewBar preview={{ ...base, mode: 'live', switchUrl: '/_beam/preview/switch?to=preview&path=%2Fabout' }} />);
        expect(screen.getByText(/You are seeing the live site/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Back to the Preview' }).getAttribute('href')).toBe('/_beam/preview/switch?to=preview&path=%2Fabout');
        expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/_beam/preview/switch?to=preview&path=%2Fabout');
    });

    it('holds forms only in the Preview: the live site at this URL is the live site (review of e9610b37)', () => {
        const submit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
        const form = (
            <form onSubmit={submit}>
                <button type="submit">Send</button>
            </form>
        );
        const { rerender } = render(<PreviewBoundary preview={base}>{form}</PreviewBoundary>);
        fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!);
        expect(submit).not.toHaveBeenCalled();
        expect(screen.getByText(/forms validate but do not submit/i)).toBeTruthy();

        rerender(<PreviewBoundary preview={{ ...base, mode: 'live' }}>{form}</PreviewBoundary>);
        fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!);
        expect(submit).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/forms validate but do not submit/i)).toBeNull();
    });

    it('offers no live page for a page the Release adds', () => {
        render(<PreviewBar preview={{ ...base, switchUrl: null }} />);

        expect(screen.queryByRole('link', { name: 'Live site' })).toBeNull();
        expect(screen.getByText('New in this Release')).toBeTruthy();
    });
});

describe('PreviewBar (Redirects)', () => {
    // ADR-0236 d12 (ADR-0232 d14; EP-31 slice 5): the bar names each URL the Release moves or takes down and where it
    // will go once it publishes; a Take-down with no target leaves its URLs not found.
    it('lists the Redirects the Release leaves, and the URLs it leaves not found', () => {
        render(<PreviewBar preview={{ ...base, redirects: [
            { from: '/about', to: '/company', reason: 'moved' },
            { from: '/legacy', to: '/pricing', reason: 'takedown' },
            { from: '/gone', to: null, reason: 'takedown' },
        ] }} />);

        const redirects = screen.getByRole('region', { name: 'Redirects this Release leaves' });
        expect(within(redirects).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
            '/about → /company (moved)',
            '/legacy → /pricing (taken down)',
            '/gone → not found (taken down)',
        ]);
        expect(screen.getByText('Redirects this Release leaves (3)')).toBeTruthy();
    });

    it('shows no Redirects list when the Release leaves none, or the server predates EP-31', () => {
        render(<PreviewBar preview={{ ...base, redirects: [] }} />);
        expect(screen.queryByRole('region', { name: 'Redirects this Release leaves' })).toBeNull();
    });
});
