import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { configureBeamInertia } from './config';
import Login from './pages/auth/login';

// `canRegister` is a per-request SERVER prop (the registration door policy), unlike passkeys which
// stays a build-time client feature flag — so the Sign up affordance is driven through the mutable
// page props here, not through configureBeamInertia().
const DEFAULT_PROPS = { canResetPassword: true, canRegister: true, demoAccounts: [], status: 'Reset link sent' };
const page = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock('@inertiajs/react', () => ({
    usePage: () => page,
    Form: ({ children, action, method }: { children: (state: unknown) => ReactNode; action: string; method: string }) => createElement('form', { action, method }, children({ processing: false, errors: { email: 'Enter your email' } })),
    Link: ({ children, ...props }: { children: ReactNode }) => createElement('a', props, children),
}));
vi.mock('./components/passkey-verify', () => ({ default: () => createElement('button', null, 'Use passkey') }));
afterEach(() => {
    configureBeamInertia({});
    page.props = { ...DEFAULT_PROPS };
});
page.props = { ...DEFAULT_PROPS };
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
    // Registration closed is a SERVER policy (canRegister=false, the same source the /register route
    // reads); passkeys off is a client feature flag. Both affordances drop; password login + reset stay.
    page.props = { ...DEFAULT_PROPS, canRegister: false };
    configureBeamInertia({ features: { passkeys: false } });
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).not.toContain('href="/register"');
    expect(html).not.toContain('Use passkey');
    expect(html).toContain('action="/login"');
    expect(html).toContain('href="/forgot-password"');
});
it('sets the status flash in the primary token, not a fixed bright green that fails contrast in light', () => {
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).toMatch(/<div class="[^"]*text-primary[^"]*">Reset link sent<\/div>/);
    expect(html).not.toContain('text-green-600');
});
it('keeps the forgot-password link on one line; it drops whole under the label on a narrow card', () => {
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).toMatch(/class="[^"]*flex-wrap[^"]*"><label[^>]*for="password"/);
    expect(html).toMatch(/class="[^"]*whitespace-nowrap[^"]*"[^>]*>Forgot your password\?/);
});
