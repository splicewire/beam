// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ success: ((_response: { redirect?: string }) => undefined) as (response: { redirect?: string }) => void, routerVisit: vi.fn() }));

vi.mock('@inertiajs/react', () => ({ router: { visit: h.routerVisit } }));
vi.mock('@laravel/passkeys/react', () => ({
    usePasskeyVerify: ({ onSuccess }: { onSuccess: (response: { redirect?: string }) => void }) => {
        h.success = onSuccess;
        return { verify: () => h.success({ redirect: '/dashboard' }), isLoading: false, error: null, isSupported: true };
    },
}));

import PasskeyVerify from '../../components/passkey-verify';

afterEach(() => {
    cleanup();
    h.routerVisit.mockClear();
    h.success = () => undefined;
});

it('calls the optional authenticated callback after passkey success and before redirecting', () => {
    const onAuthenticated = vi.fn();
    render(<PasskeyVerify onAuthenticated={onAuthenticated} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in with a passkey/i }));

    expect(onAuthenticated).toHaveBeenCalledOnce();
    expect(h.routerVisit).toHaveBeenCalledWith('/dashboard');
});

it('keeps passkey confirmation usable without an authentication callback', () => {
    render(<PasskeyVerify label="Confirm with passkey" />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm with passkey' }));

    expect(h.routerVisit).toHaveBeenCalledWith('/dashboard');
});
