import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import Login from './login';

// The "Sign up" affordance must follow the SERVER registration policy — the `canRegister` page prop,
// sourced from `Features::enabled(Features::registration())`, the same source the /register route
// reads — NOT a build-time client feature flag. On a closed-door host (ACCOUNT_REGISTRATION=closed)
// /register 404s, so the link must not render.
//
// Red-first guard: `featureEnabled('registration')` is forced TRUE below, so a gate that still reads
// the client feature flag renders the dead link and fails the first assertion; only a gate on the
// `canRegister` prop passes. Rendered via renderToStaticMarkup to match the repo's auth-defaults test
// (no jsdom/testing-library needed — the link is static markup).
const page = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock('@inertiajs/react', () => ({
    usePage: () => page,
    Form: ({
        children,
        action,
        method,
    }: {
        children: (s: { errors: Record<string, string>; processing: boolean }) => ReactNode;
        action: string;
        method: string;
    }) => createElement('form', { action, method }, children({ errors: {}, processing: false })),
    Link: ({ children, ...props }: { children: ReactNode; href: string }) =>
        createElement('a', props, children),
}));

// registration feature flag forced ON; passkeys OFF (keep the passkey island out of the render).
vi.mock('../../config', () => ({ featureEnabled: (f: string) => f === 'registration' }));
vi.mock('../../components/passkey-verify', () => ({ default: () => createElement('span') }));

afterEach(() => {
    page.props = {};
});

it('hides the Sign up link when the server says registration is closed (canRegister=false)', () => {
    page.props = { status: null, canResetPassword: true, canRegister: false };
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).not.toContain('href="/register"');
    expect(html).not.toContain('Sign up');
});

it('shows the Sign up link when the server says registration is open (canRegister=true)', () => {
    page.props = { status: null, canResetPassword: true, canRegister: true };
    const html = renderToStaticMarkup(createElement(Login));
    expect(html).toContain('href="/register"');
    expect(html).toContain('Sign up');
});
