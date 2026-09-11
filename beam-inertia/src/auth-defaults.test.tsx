import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { configureBeamInertia } from './config';
import Login from './pages/auth/login';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { canResetPassword: true, demoAccounts: [], status: 'Reset link sent' } }),
    Form: ({ children, action, method }: { children: (state: unknown) => ReactNode; action: string; method: string }) => createElement('form', { action, method }, children({ processing: false, errors: { email: 'Enter your email' } })),
    Link: ({ children, ...props }: { children: ReactNode }) => createElement('a', props, children),
}));
vi.mock('./components/passkey-verify', () => ({ default: () => createElement('button', null, 'Use passkey') }));
afterEach(() => configureBeamInertia({}));
it('preserves Fortify form, errors, status and enabled recovery actions', () => {
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).toContain('action="/login"');
    expect(html).toContain('method="post"');
    expect(html).toContain('Enter your email');
    expect(html).toContain('Reset link sent');
    expect(html).toContain('href="/register"');
    expect(html).toContain('Use passkey');
    expect(html).toContain('href="/forgot-password"');
});
it('removes disabled auth affordances without changing password login or recovery', () => {
    configureBeamInertia({ features: { registration: false, passkeys: false } });
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).not.toContain('href="/register"');
    expect(html).not.toContain('Use passkey');
    expect(html).toContain('action="/login"');
    expect(html).toContain('href="/forgot-password"');
});
