import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { beamAgreementsPages } from './index';
import Consent, { type ConsentProps } from './Consent';

// agreements 12: the counterparty's signed page.

const waiting: ConsentProps = {
    title: 'Voice use consent',
    label: 'v1',
    content: 'You let us use your voice in this work.',
    summary: 'First.',
    askedBy: 'Ada',
    about: "Kim's voice",
    status: 'requested',
    actions: { grant: '/consent/1/grant?signature=g', decline: '/consent/1/decline?signature=d' },
};

describe('the consent page', () => {
    it('is in the page map a host merges', async () => {
        expect((await beamAgreementsPages['agreements/consent']()).default).toBe(Consent);
    });

    it('shows what is asked, who asks and about what, and offers consent or decline while waiting', () => {
        render(<Consent {...waiting} />);
        expect(screen.getByRole('heading', { level: 1, name: 'Voice use consent' })).toBeTruthy();
        expect(screen.getByText(/Ada asks for your consent about Kim's voice/)).toBeTruthy();
        expect(screen.getByText('You let us use your voice in this work.')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'I consent' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Decline' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Withdraw my consent' })).toBeNull();
    });

    it('posts to the server-signed action URL, then reloads the signed page', async () => {
        const request = vi.fn(async () => ({ status: 200, data: { status: 'granted' } })) as never;
        const reload = vi.fn();
        render(<Consent {...waiting} request={request} reload={reload} />);

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'I consent' })));
        await waitFor(() => expect(reload).toHaveBeenCalled());
        expect(request).toHaveBeenCalledWith('POST', '/consent/1/grant?signature=g');
    });

    it('offers only withdraw after a grant, and says so', () => {
        render(<Consent {...waiting} status="granted" actions={{ withdraw: '/consent/1/withdraw?signature=w' }} />);
        expect(screen.getByText('You gave your consent. You can withdraw it at any time.')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Withdraw my consent' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'I consent' })).toBeNull();
    });

    it('shows a refusal and records the page as it was', async () => {
        const request = vi.fn(async () => {
            throw new Error('This link is not valid, or it has expired.');
        }) as never;
        const reload = vi.fn();
        render(<Consent {...waiting} request={request} reload={reload} />);

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Decline' })));
        expect((await screen.findByRole('alert')).textContent).toBe('This link is not valid, or it has expired.');
        expect(reload).not.toHaveBeenCalled();
    });
});
