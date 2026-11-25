import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AcceptInvitationPanel } from './accept-invitation-panel';

/*
 * localization 69b: the invited line names the role by the server's `roleLabel` (the Role enum's catalog line) when the
 * page sends one, and keeps today's text when it does not.
 */
afterEach(cleanup);

function invitedLine(props: { role?: string | null; roleLabel?: string | null }): string {
    render(<AcceptInvitationPanel state="ready" teamName="Acme" email="guest@example.test" inviterName="Olive Owner" {...props} />);
    return screen.getByText((_, node) => node?.tagName === 'P' && (node.textContent ?? '').startsWith('Olive Owner invited')).textContent ?? '';
}

it('names the role by the server label when the page sends one', () => {
    expect(invitedLine({ role: 'admin', roleLabel: 'Administrateur' })).toBe('Olive Owner invited guest@example.test to join Acme as Administrateur.');
});

it('keeps the English line byte-identical when the server label is the English catalog line', () => {
    const before = invitedLine({ role: 'admin' });
    cleanup();
    expect(invitedLine({ role: 'admin', roleLabel: 'Admin' })).toBe(before);
    expect(before).toBe('Olive Owner invited guest@example.test to join Acme as Admin.');
});

it('falls back to the capitalised role when the server sends no label (an unknown role, or an older server)', () => {
    expect(invitedLine({ role: 'auditor', roleLabel: null })).toBe('Olive Owner invited guest@example.test to join Acme as Auditor.');
    cleanup();
    expect(invitedLine({ role: 'member' })).toBe('Olive Owner invited guest@example.test to join Acme as Member.');
});

it('keeps the keyed member wording when there is no role at all', () => {
    expect(invitedLine({ role: null, roleLabel: null })).toBe('Olive Owner invited guest@example.test to join Acme as Member.');
});
