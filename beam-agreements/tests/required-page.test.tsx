import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const posted: Array<{ method: string; url: string; body: unknown }> = [];
vi.mock('@schemastud/frame/session', () => ({
    createSessionRequest: () => async (method: string, url: string, _query: unknown, body: unknown) => {
        posted.push({ method, url, body });
        return { data: { data: {} } };
    },
}));

import { AgreementsRequired, beamAgreementsPages } from '../src/index';
import { sameOrigin } from '../src/pages/AgreementsRequired';

afterEach(() => {
    cleanup();
    posted.length = 0;
});

/** agreements 07: the prompt a refused page visit lands on, reusing 06's step-up dialog. */
const TERMS = {
    key: 'terms',
    version: 1,
    digest: 'd'.repeat(64),
    kind: 'contract',
    title: 'Terms of Service',
    scope: 'party',
    subject: null,
    readUrl: '/beam/agreements/agreements/terms',
    acceptOperation: 'agreements.accept',
    member: null,
    label: 'v1',
    content: 'The terms, in full.',
    moved: false,
};

describe('the agreements/required page', () => {
    it('is in the page map a host merges', async () => {
        const page = await beamAgreementsPages['agreements/required']();
        expect(page.default).toBe(AgreementsRequired);
    });

    it('asks with the step-up dialog on arrival; accepting records it, then goes where the person was going', async () => {
        const visit = vi.fn();
        render(<AgreementsRequired requirements={[TERMS]} intended="/reports?q=1" back="/home" acceptUrl="/beam/agreements/agreements/accept" visit={visit} />);

        const dialog = await screen.findByRole('dialog', { name: 'Terms of Service' });
        expect(dialog.textContent).toContain('The terms, in full.');
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }));

        await waitFor(() => expect(visit).toHaveBeenCalledWith('/reports?q=1'));
        expect(posted).toEqual([
            { method: 'POST', url: '/beam/agreements/agreements/accept', body: { agreement: 'terms', version: 'v1', digest: TERMS.digest } },
        ]);
    });

    it('declining stays on the prompt with a way back, records nothing, and can ask again', async () => {
        const visit = vi.fn();
        render(<AgreementsRequired requirements={[TERMS]} intended="/reports" back="/home" acceptUrl="/accept" visit={visit} />);

        await screen.findByRole('dialog');
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(await screen.findByText(/didn't accept Terms of Service, so nothing was done/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Go back' }).getAttribute('href')).toBe('/home');
        expect(posted).toEqual([]);
        expect(visit).not.toHaveBeenCalled();

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Review again' })));
        expect(await screen.findByRole('dialog', { name: 'Terms of Service' })).toBeTruthy();
    });

    it('never navigates or links off-site, whatever the server sent (review P2 1, defence in depth)', async () => {
        const visit = vi.fn();
        render(
            <AgreementsRequired
                requirements={[TERMS]}
                intended="https://evil.example/after"
                back="javascript:alert(1)"
                acceptUrl="/accept"
                visit={visit}
            />,
        );
        await screen.findByRole('dialog');
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect((await screen.findByRole('link', { name: 'Go back' })).getAttribute('href')).toBe('/');

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Review again' })));
        fireEvent.click(await screen.findByRole('button', { name: 'I agree' }));
        await waitFor(() => expect(visit).toHaveBeenCalledWith('/'));
    });

    it('keeps same-origin destinations and replaces everything else', () => {
        const origin = 'http://localhost:3000';
        expect(sameOrigin('/reports?q=1#a', '/', origin)).toBe('/reports?q=1#a');
        expect(sameOrigin('http://localhost:3000/x?y=1', '/', origin)).toBe('/x?y=1');
        for (const bad of ['//evil.example/x', '/\\evil.example', 'javascript:alert(1)', 'https://evil.example/', 'http://localhost:3001/x', 'data:text/html,hi']) {
            expect(sameOrigin(bad, '/home', origin)).toBe('/home');
        }
    });

    it('never shows a moved version: no dialog, no accept, a way to try again', () => {
        render(
            <AgreementsRequired
                requirements={[{ ...TERMS, moved: true, content: null, label: null }]}
                intended="/reports"
                back="/home"
                acceptUrl="/accept"
            />,
        );

        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByText(/changed while you were on your way/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Try again' }).getAttribute('href')).toBe('/reports');
        expect(posted).toEqual([]);
    });
});
