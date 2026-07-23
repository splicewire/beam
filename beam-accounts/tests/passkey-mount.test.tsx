import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the WebAuthn ceremony module — the browser API is not present in jsdom, and the seam-2
// contract is "the hook drives the injected transport + a mocked ceremony", not real crypto.
vi.mock('../src/webauthn', () => ({
    isWebAuthnSupported: vi.fn(() => true),
    runAssertionCeremony: vi.fn(async () => ({ id: 'assertion', type: 'public-key' })),
    runAttestationCeremony: vi.fn(async () => ({ id: 'attestation', type: 'public-key' })),
}));

import { AuthProvider, PasskeyButton, PasskeysSection } from '../src/index';
import type { AuthClient, PasskeyData } from '../src/index';
import * as webauthn from '../src/webauthn';

beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

const AUTH_RESULT = { access_token: 'passkey-token' };

const CHALLENGE = { handle: 'h-1', options: { challenge: 'abc', rpId: 'test' } };

function fakeClient(overrides: Partial<AuthClient> = {}): AuthClient {
    return {
        login: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
        passkeyLoginOptions: vi.fn(async () => CHALLENGE),
        passkeyLogin: vi.fn(async () => AUTH_RESULT),
        passkeyRegistrationOptions: vi.fn(async () => CHALLENGE),
        passkeyRegister: vi.fn(async () => ({ id: 1, name: 'My laptop', last_used_at: null, created_at: null })),
        passkeys: vi.fn(async () => []),
        deletePasskey: vi.fn(async () => {}),
        ...overrides,
    };
}

function mount(ui: ReactNode, client: AuthClient): void {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider services={{ client }}>{ui}</AuthProvider>
        </QueryClientProvider>,
    );
}

describe('PasskeyButton (ticket 10)', () => {
    it('runs options → ceremony → verify and fires onSuccess with the minted result', async () => {
        vi.mocked(webauthn.isWebAuthnSupported).mockReturnValue(true);
        const client = fakeClient();
        const onSuccess = vi.fn();
        mount(<PasskeyButton onSuccess={onSuccess} />, client);

        fireEvent.click(screen.getByRole('button', { name: /passkey/i }));

        await waitFor(() => expect(client.passkeyLoginOptions).toHaveBeenCalledTimes(1));
        expect(webauthn.runAssertionCeremony).toHaveBeenCalledWith(CHALLENGE.options);
        await waitFor(() =>
            expect(client.passkeyLogin).toHaveBeenCalledWith({
                handle: 'h-1',
                credential: { id: 'assertion', type: 'public-key' },
            }),
        );
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(AUTH_RESULT));
    });

    it('renders nothing when WebAuthn is unsupported', () => {
        vi.mocked(webauthn.isWebAuthnSupported).mockReturnValue(false);
        mount(<PasskeyButton onSuccess={vi.fn()} />, fakeClient());
        expect(screen.queryByRole('button', { name: /passkey/i })).toBeNull();
    });

    it('surfaces a cancelled ceremony inline', async () => {
        vi.mocked(webauthn.isWebAuthnSupported).mockReturnValue(true);
        vi.mocked(webauthn.runAssertionCeremony).mockRejectedValueOnce(
            new Error('Passkey verification was cancelled.'),
        );
        mount(<PasskeyButton onSuccess={vi.fn()} />, fakeClient());

        fireEvent.click(screen.getByRole('button', { name: /passkey/i }));

        expect((await screen.findByRole('alert')).textContent).toMatch(/cancelled/i);
    });
});

describe('PasskeysSection (ticket 11)', () => {
    it('lists registered passkeys with name + last-used', async () => {
        vi.mocked(webauthn.isWebAuthnSupported).mockReturnValue(true);
        const fixture: PasskeyData[] = [
            { id: 7, name: 'Work laptop', last_used_at: '2026-07-01T00:00:00+00:00', created_at: null },
        ];
        mount(<PasskeysSection />, fakeClient({ passkeys: vi.fn(async () => fixture) }));

        expect(await screen.findByText('Work laptop')).toBeTruthy();
    });

    it('registers a passkey through the attestation ceremony + transport', async () => {
        vi.mocked(webauthn.isWebAuthnSupported).mockReturnValue(true);
        const client = fakeClient();
        mount(<PasskeysSection />, client);

        fireEvent.change(screen.getByLabelText(/add a passkey/i), { target: { value: 'My phone' } });
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => expect(client.passkeyRegistrationOptions).toHaveBeenCalledTimes(1));
        expect(webauthn.runAttestationCeremony).toHaveBeenCalledWith(CHALLENGE.options);
        await waitFor(() =>
            expect(client.passkeyRegister).toHaveBeenCalledWith({
                handle: 'h-1',
                name: 'My phone',
                credential: { id: 'attestation', type: 'public-key' },
            }),
        );
    });

    it('deletes a passkey through the injected transport', async () => {
        vi.mocked(webauthn.isWebAuthnSupported).mockReturnValue(true);
        const fixture: PasskeyData[] = [
            { id: 9, name: 'Old key', last_used_at: null, created_at: null },
        ];
        const client = fakeClient({ passkeys: vi.fn(async () => fixture) });
        mount(<PasskeysSection />, client);

        fireEvent.click(await screen.findByRole('button', { name: /delete old key/i }));

        await waitFor(() => expect(client.deletePasskey).toHaveBeenCalledWith(9));
    });
});
