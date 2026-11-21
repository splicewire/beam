import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { agreementBlockedStep, blockedAgreementKey, type BlockedTransition } from './AgreementBlockedStep';

// agreements 11b: the accept step on a workflow move refused by "Agreement is current".

const refused: BlockedTransition = {
    name: 'submit',
    guard: 'agreement-is-current',
    metadata: { guardParams: { agreement: 'terms' } },
    reason: 'To take this step, accept Terms of Service first.',
};

function requestWith(row: unknown = { key: 'terms', title: 'Terms of Service', version: { label: 'v1', digest: 'd1', content: 'The terms, in full.', summary: 'First terms.' } }) {
    return vi.fn(async (method: string) => (method === 'GET' ? { status: 200, data: { data: row } } : { status: 201, data: null })) as never;
}

describe('agreementBlockedStep', () => {
    it('names the agreement only for a move the agreement guard refused', () => {
        expect(blockedAgreementKey(refused)).toBe('terms');
        expect(blockedAgreementKey({ ...refused, reason: null })).toBeNull();
        expect(blockedAgreementKey({ ...refused, guard: 'gpu-quota' })).toBeNull();
        expect(blockedAgreementKey({ ...refused, metadata: null })).toBeNull();
        expect(agreementBlockedStep({ onAccepted: () => {} })({ ...refused, guard: 'other' })).toBeNull();
    });

    it('opens 06 step-up on the exact text with what changed; accepting runs the accept operation, then onAccepted', async () => {
        const request = requestWith();
        const onAccepted = vi.fn();
        render(<>{agreementBlockedStep({ onAccepted, request })(refused)}</>);

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Review and accept' })));
        const dialog = await screen.findByRole('dialog', { name: 'Terms of Service' });
        expect(dialog.textContent).toContain('The terms, in full.');
        expect(dialog.textContent).toContain('What changed: First terms.');
        expect(request).toHaveBeenCalledWith('GET', '/beam/agreements/agreements/terms');

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'I agree' })));
        await waitFor(() => expect(onAccepted).toHaveBeenCalledTimes(1));
        expect(request).toHaveBeenCalledWith('POST', '/beam/agreements/agreements/accept', undefined, { agreement: 'terms', version: 'v1', digest: 'd1' });
    });

    it('declining records nothing and does not call onAccepted', async () => {
        const request = requestWith();
        const onAccepted = vi.fn();
        render(<>{agreementBlockedStep({ onAccepted, request })(refused)}</>);

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Review and accept' })));
        fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect((request as unknown as ReturnType<typeof vi.fn>).mock.calls.every(([method]) => method === 'GET')).toBe(true);
        expect(onAccepted).not.toHaveBeenCalled();
    });

    it('says so, and does nothing, when the agreement has no version to show', async () => {
        const onAccepted = vi.fn();
        render(<>{agreementBlockedStep({ onAccepted, request: requestWith({ key: 'terms', title: 'Terms', version: null }) })(refused)}</>);

        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Review and accept' })));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(onAccepted).not.toHaveBeenCalled();
    });
});
