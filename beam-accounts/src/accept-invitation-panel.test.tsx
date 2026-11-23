import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { AcceptInvitationPanel } from './accept-invitation-panel';
import type { AgreementMember } from './agreement-prompt';

afterEach(() => vi.unstubAllGlobals());

it('requires a verified member before accepting an invitation with blocking terms', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
        data: { key: 'terms', kind: 'contract', title: 'Terms', version: { digest: 'sha256:terms', content: 'The frozen terms.' } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    const onAccept = vi.fn();

    function Form() {
        const [member, setMember] = useState<AgreementMember>();
        return <AcceptInvitationPanel
            state="ready"
            teamName="North"
            agreements={[{ key: 'terms', readUrl: '/agreements/terms', required: true, version: 3, digest: 'sha256:terms' }]}
            agreementMember={member}
            onAgreementMemberChange={setMember}
            onAccept={onAccept}
        />;
    }

    render(<Form />);
    const accept = screen.getByRole('button', { name: 'Accept invitation' });
    expect((accept as HTMLButtonElement).disabled).toBe(true);
    const checkbox = await screen.findByRole('checkbox', { name: 'I agree to Terms' });
    await waitFor(() => expect((checkbox as HTMLInputElement).disabled).toBe(false));
    fireEvent.click(checkbox);
    await waitFor(() => expect((accept as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(accept);
    expect(onAccept).toHaveBeenCalledOnce();
});

it('allows invitation acceptance with an informational notice and no member checkbox', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
        data: { key: 'privacy', kind: 'notice', title: 'Privacy notice', version: { digest: 'sha256:privacy', content: 'How we use your data.' } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    const onAccept = vi.fn();

    render(<AcceptInvitationPanel
        state="ready"
        teamName="North"
        agreements={[{ key: 'privacy', readUrl: '/agreements/privacy', required: false }]}
        onAccept={onAccept}
    />);

    expect(await screen.findByText('How we use your data.')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }));
    expect(onAccept).toHaveBeenCalledOnce();
});
