// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
    page: { props: {} as Record<string, unknown> },
    nextUrl: '/dashboard',
    reportEvent: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    Form: ({ action, onStart, onSuccess, onError, children }: {
        action: string;
        onStart?: () => void;
        onSuccess?: (page: { url: string }) => void;
        onError?: (errors: Record<string, string>) => void;
        children: (state: { errors: Record<string, string>; processing: boolean; clearErrors: () => void }) => ReactNode;
    }) => {
        return (
            <form>
                <button type="button" data-testid={`success:${action}`} onClick={() => { onStart?.(); onSuccess?.({ url: h.nextUrl }); }}>
                    complete {action}
                </button>
                <button type="button" data-testid={`error:${action}`} onClick={() => onError?.({ code: 'Invalid code.' })}>
                    fail {action}
                </button>
                {children({ errors: {}, processing: false, clearErrors: () => undefined })}
            </form>
        );
    },
    Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
    usePage: () => h.page,
    setLayoutProps: () => undefined,
}));
vi.mock('../../config', () => ({ featureEnabled: () => true }));
vi.mock('../../components/password-input', () => ({ default: (props: Record<string, unknown>) => <input {...props} /> }));
vi.mock('../../components/ui/checkbox', () => ({ Checkbox: (props: Record<string, unknown>) => <input type="checkbox" {...props} /> }));
vi.mock('@splicewire/beam-ux/site', () => ({ reportEvent: h.reportEvent }));
vi.mock('../../components/passkey-verify', () => ({
    default: ({ onAuthenticated }: { onAuthenticated?: () => void }) => (
        <button type="button" onClick={onAuthenticated}>Use passkey</button>
    ),
}));

import Login from './login';
import Register from './register';
import TwoFactorChallenge from './two-factor-challenge';

afterEach(() => {
    cleanup();
    sessionStorage.clear();
    h.page.props = { canRegister: true, canResetPassword: true, demoAccounts: [] };
    h.nextUrl = '/dashboard';
    h.reportEvent.mockClear();
});

it('reports sign_up after successful registration, including a verify-email redirect', () => {
    h.nextUrl = '/email/verify';
    render(<Register />);

    fireEvent.click(screen.getByTestId('success:/register'));

    expect(h.reportEvent).toHaveBeenCalledExactlyOnceWith('sign_up', { method: 'password' });
});

it('reports a password login immediately unless it enters the two-factor challenge', () => {
    render(<Login />);

    fireEvent.click(screen.getByTestId('success:/login'));
    expect(h.reportEvent).toHaveBeenCalledExactlyOnceWith('login', { method: 'password' });

    h.reportEvent.mockClear();
    cleanup();
    h.nextUrl = '/two-factor-challenge';
    render(<Login />);
    fireEvent.click(screen.getByTestId('success:/login'));

    expect(h.reportEvent).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('beam.analytics.pending-login-method')).toBe('password');
});

it('reports one login with the first-factor method after 2FA success, and consumes the pending method', () => {
    sessionStorage.setItem('beam.analytics.pending-login-method', 'password');
    render(<TwoFactorChallenge />);

    fireEvent.click(screen.getByTestId('error:/two-factor-challenge'));
    expect(h.reportEvent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('success:/two-factor-challenge'));
    fireEvent.click(screen.getByTestId('success:/two-factor-challenge'));

    expect(h.reportEvent).toHaveBeenCalledExactlyOnceWith('login', { method: 'password' });
    expect(sessionStorage.getItem('beam.analytics.pending-login-method')).toBeNull();
});

it('reports passkey login only from the Login surface', () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Use passkey' }));

    expect(h.reportEvent).toHaveBeenCalledExactlyOnceWith('login', { method: 'passkey' });
});
