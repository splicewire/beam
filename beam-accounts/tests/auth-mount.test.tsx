import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
// Import through the package barrel — the same entry a host consumes.
import {
    AuthProvider,
    ForgotPasswordForm,
    LoginPanel,
    ResetPasswordForm,
} from '../src/index';
import type { AuthClient } from '../src/index';

beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

const AUTH_RESULT = { access_token: 'plaintext-token', id: 'user-1' };

function fakeClient(overrides: Partial<AuthClient> = {}): AuthClient {
    return {
        login: vi.fn(async () => AUTH_RESULT),
        requestPasswordReset: vi.fn(async () => {}),
        resetPassword: vi.fn(async () => {}),
        ...overrides,
    };
}

function mount(ui: ReactNode, client: AuthClient, onError?: (e: unknown) => void): void {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider services={{ client, onError }}>{ui}</AuthProvider>
        </QueryClientProvider>,
    );
}

function typeInto(label: RegExp, value: string): void {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('LoginPanel', () => {
    it('calls the injected transport with email/password and fires onSuccess with the result', async () => {
        const client = fakeClient();
        const onSuccess = vi.fn();
        mount(<LoginPanel onSuccess={onSuccess} />, client);

        typeInto(/email/i, 'me@test.com');
        typeInto(/^password$/i, 's3cret');
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(client.login).toHaveBeenCalledTimes(1));
        // remember gated off by default → not in the payload.
        expect(client.login).toHaveBeenCalledWith({ email: 'me@test.com', password: 's3cret' });
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(AUTH_RESULT));
    });

    it('sends the remember flag only when the checkbox is gated on and checked', async () => {
        const client = fakeClient();
        mount(<LoginPanel onSuccess={vi.fn()} showRemember />, client);

        typeInto(/email/i, 'me@test.com');
        typeInto(/^password$/i, 's3cret');
        fireEvent.click(screen.getByLabelText(/remember me/i));
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() =>
            expect(client.login).toHaveBeenCalledWith({
                email: 'me@test.com',
                password: 's3cret',
                remember: true,
            }),
        );
    });

    it('surfaces a failed sign-in inline and via onError', async () => {
        const client = fakeClient({
            login: vi.fn(async () => {
                throw new Error('Invalid email or password.');
            }),
        });
        const onError = vi.fn();
        mount(<LoginPanel onSuccess={vi.fn()} />, client, onError);

        typeInto(/email/i, 'me@test.com');
        typeInto(/^password$/i, 'wrong');
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect((await screen.findByRole('alert')).textContent).toMatch(/invalid email or password/i);
        expect(onError).toHaveBeenCalled();
    });

    it('honors the prop gates: forgot link, remember, and passkey slot hidden by default', () => {
        mount(<LoginPanel onSuccess={vi.fn()} passkeySlot={<button>passkey</button>} />, fakeClient());
        expect(screen.queryByText(/forgot your password/i)).toBeNull();
        expect(screen.queryByLabelText(/remember me/i)).toBeNull();
        // Slot content not rendered while showPasskeySlot is off.
        expect(screen.queryByText('passkey')).toBeNull();
        expect(screen.queryByText(/or continue with email/i)).toBeNull();
    });

    it('renders the passkey slot + divider and fires the forgot handler when gated on', () => {
        const onForgot = vi.fn();
        mount(
            <LoginPanel
                onSuccess={vi.fn()}
                showForgotLink
                onForgot={onForgot}
                showPasskeySlot
                passkeySlot={<button>passkey</button>}
            />,
            fakeClient(),
        );
        expect(screen.getByText('passkey')).toBeTruthy();
        expect(screen.getByText(/or continue with email/i)).toBeTruthy();
        fireEvent.click(screen.getByText(/forgot your password/i));
        expect(onForgot).toHaveBeenCalled();
    });

    it('reveals the password when the eye toggle is pressed', () => {
        mount(<LoginPanel onSuccess={vi.fn()} />, fakeClient());
        const field = screen.getByLabelText(/^password$/i) as HTMLInputElement;
        expect(field.type).toBe('password');
        fireEvent.click(screen.getByRole('button', { name: /show password/i }));
        expect(field.type).toBe('text');
    });

    it('renders the injected brand and host footer', () => {
        mount(
            <LoginPanel
                onSuccess={vi.fn()}
                brand={<div data-testid="brand">mark</div>}
                footer={<button>Continue with Google</button>}
            />,
            fakeClient(),
        );
        expect(screen.getByTestId('brand')).toBeTruthy();
        expect(screen.getByText(/continue with google/i)).toBeTruthy();
    });
});

describe('ForgotPasswordForm', () => {
    it('requests a reset link and shows an enumeration-safe confirmation', async () => {
        const client = fakeClient();
        mount(<ForgotPasswordForm />, client);

        typeInto(/email/i, 'maybe@test.com');
        fireEvent.click(screen.getByRole('button', { name: /reset link/i }));

        await waitFor(() =>
            expect(client.requestPasswordReset).toHaveBeenCalledWith({ email: 'maybe@test.com' }),
        );
        expect((await screen.findByRole('status')).textContent).toMatch(/if an account exists/i);
    });
});

describe('ResetPasswordForm', () => {
    it('posts token + email + new password and fires onSuccess', async () => {
        const client = fakeClient();
        const onSuccess = vi.fn();
        mount(<ResetPasswordForm token="tok-123" email="me@test.com" onSuccess={onSuccess} />, client);

        typeInto(/^new password$/i, 'brand-new-pass');
        typeInto(/^confirm new password$/i, 'brand-new-pass');
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() =>
            expect(client.resetPassword).toHaveBeenCalledWith({
                token: 'tok-123',
                email: 'me@test.com',
                password: 'brand-new-pass',
                password_confirmation: 'brand-new-pass',
            }),
        );
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    it('blocks mismatched confirmations without hitting the transport', () => {
        const client = fakeClient();
        mount(<ResetPasswordForm token="t" email="me@test.com" />, client);

        typeInto(/^new password$/i, 'aaaa');
        typeInto(/^confirm new password$/i, 'bbbb');
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(screen.getByRole('alert').textContent).toMatch(/do not match/i);
        expect(client.resetPassword).not.toHaveBeenCalled();
    });

    it('surfaces an expired/invalid link error inline', async () => {
        const client = fakeClient({
            resetPassword: vi.fn(async () => {
                throw new Error('This password reset token is invalid.');
            }),
        });
        mount(<ResetPasswordForm token="stale" email="me@test.com" />, client);

        typeInto(/^new password$/i, 'brand-new-pass');
        typeInto(/^confirm new password$/i, 'brand-new-pass');
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect((await screen.findByRole('alert')).textContent).toMatch(/invalid/i);
    });
});
