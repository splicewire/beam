import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AgreementPrompt } from './agreement-prompt';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

const responseFor = (data: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ data }),
});

it('shows a notice as information and never creates a member', async () => {
    const fetch = vi.fn().mockResolvedValue(responseFor({
        key: 'privacy',
        kind: 'notice',
        title: 'Privacy notice',
        version: { digest: 'notice-digest', content: 'We use your information to create an account.' },
    }));
    vi.stubGlobal('fetch', fetch);
    const onChange = vi.fn();

    render(<AgreementPrompt agreementKey="privacy" readUrl="/beam/agreements/agreements/privacy" onChange={onChange} />);

    expect(await screen.findByText('We use your information to create an account.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Privacy notice');
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('/beam/agreements/agreements/privacy', expect.objectContaining({
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    }));
});

it('clears a previously selected member when its Agreement becomes a notice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor({
        key: 'privacy',
        kind: 'notice',
        title: 'Privacy notice',
        version: { digest: 'notice-digest', content: 'We use your information to create an account.' },
    })));
    const onChange = vi.fn();

    render(<AgreementPrompt
        agreementKey="privacy"
        readUrl="/beam/agreements/agreements/privacy"
        value={{ key: 'privacy', version: 2, digest: 'old-contract-digest' }}
        onChange={onChange}
    />);

    expect(await screen.findByText('We use your information to create an account.')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(undefined));
});

it('uses the verified AgreementMemberWidget for a blocking requirement', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor({
        key: 'terms',
        kind: 'contract',
        title: 'Terms',
        version: { digest: 'terms-digest', content: 'The frozen terms.' },
    })));
    const onChange = vi.fn();

    render(<AgreementPrompt
        agreementKey="terms"
        readUrl="/beam/agreements/agreements/terms"
        version={3}
        digest="terms-digest"
        onChange={onChange}
    />);

    const checkbox = await screen.findByRole('checkbox', { name: 'I agree to Terms' });
    expect(await screen.findByText('The frozen terms.')).toBeTruthy();
    fireEvent.click(checkbox);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ key: 'terms', version: 3, digest: 'terms-digest' }));
});

it('hides frozen text and the checkbox when the displayed digest is stale', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor({
        key: 'terms',
        kind: 'contract',
        title: 'Terms',
        version: { digest: 'new-digest', content: 'Moved terms must not be shown as accepted.' },
    })));
    const onChange = vi.fn();

    render(<AgreementPrompt
        agreementKey="terms"
        readUrl="/beam/agreements/agreements/terms"
        version={3}
        digest="old-digest"
        onChange={onChange}
    />);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Moved terms must not be shown as accepted.')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
});

it.each([401, 403, 404])('does not show agreement text or a member when read returns %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor(null, status)));
    const onChange = vi.fn();

    render(<AgreementPrompt
        agreementKey="terms"
        readUrl="/beam/agreements/agreements/terms"
        version={3}
        digest="terms-digest"
        onChange={onChange}
    />);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
});
