import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgreementNotices, type AgreementNotice } from './AgreementNotices';

const notice: AgreementNotice = {
    key: 'terms',
    title: 'Terms of Service',
    label: 'v2',
    digest: 'd2',
    effectiveAt: '2026-11-20T00:00:00+00:00',
    summary: 'We now share data with processors.',
    version: 2,
    readUrl: '/beam/agreements/agreements/terms',
    legalUrl: '/legal/terms',
};

function requestWith(notices: AgreementNotice[], acceptUrl: string | null = '/beam/agreements/agreements/accept', acknowledgeUrl: string | null = '/beam/agreements/agreements/acknowledge') {
    return vi.fn(async (method: string) => (method === 'GET' ? { status: 200, data: { data: notices, acceptUrl, acknowledgeUrl } } : { status: 201, data: null })) as never;
}

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe('<AgreementNotices>', () => {
    it('shows a notice with what changed and a link to read it, and renders nothing when there is none', async () => {
        const { unmount } = render(<AgreementNotices request={requestWith([notice])} />);
        expect(await screen.findByText(/has a new version \(v2\)/)).toBeTruthy();
        expect(screen.getByText('We now share data with processors.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Read it' }).getAttribute('href')).toBe('/legal/terms');
        unmount();

        const { container } = render(<AgreementNotices request={requestWith([])} />);
        await waitFor(() => expect(container.innerHTML).toBe(''));
    });

    it('dismissing records nothing on the server, and stays dismissed for that version only', async () => {
        const request = requestWith([notice]);
        const { unmount } = render(<AgreementNotices request={request} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
        expect(screen.queryByText(/has a new version/)).toBeNull();
        expect((request as unknown as ReturnType<typeof vi.fn>).mock.calls.every(([method]) => method === 'GET')).toBe(true);
        unmount();

        render(<AgreementNotices request={requestWith([notice])} />);
        await new Promise((r) => setTimeout(r, 0));
        expect(screen.queryByText(/has a new version/)).toBeNull();

        render(<AgreementNotices request={requestWith([{ ...notice, label: 'v3', digest: 'd3' }])} />);
        expect(await screen.findByText(/has a new version \(v3\)/)).toBeTruthy();
    });

    it('"I agree" runs the ordinary accept operation with the version and digest', async () => {
        const request = requestWith([notice]);
        render(<AgreementNotices request={request} />);
        fireEvent.click(await screen.findByRole('button', { name: 'I agree' }));
        await waitFor(() => expect(screen.queryByText(/has a new version/)).toBeNull());
        expect(request).toHaveBeenCalledWith('POST', '/beam/agreements/agreements/accept', undefined, { agreement: 'terms', version: 'v2', digest: 'd2' });
    });

    it('agreements 10b: a notice kind is acknowledged through its own operation, not agreed to', async () => {
        const request = requestWith([{ ...notice, key: 'privacy', kind: 'notice', title: 'Privacy notice' }]);
        render(<AgreementNotices request={request} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Acknowledge' }));
        await waitFor(() => expect(screen.queryByText(/has a new version/)).toBeNull());
        expect(request).toHaveBeenCalledWith('POST', '/beam/agreements/agreements/acknowledge', undefined, { agreement: 'privacy', version: 'v2', digest: 'd2' });
        expect(screen.queryByRole('button', { name: 'I agree' })).toBeNull();
    });
});
