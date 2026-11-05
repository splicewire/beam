import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import Login from './login';

// S1 (owner-review-20261026 ticket 01): the session login mounts beam-accounts' one DemoLogin, fed from the page
// props the server gates. Demo mode publishes `demoAccounts`; the third, local-only gate publishes
// `demoUserSearchUrl`. Absent props draw nothing, so a production page carries no demo affordance at all.
const page = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock('@inertiajs/react', () => ({
    usePage: () => page,
    Form: ({ children, action, method }: { children: (s: { errors: Record<string, string>; processing: boolean }) => ReactNode; action: string; method: string }) =>
        createElement('form', { action, method }, children({ errors: {}, processing: false })),
    Link: ({ children, ...props }: { children: ReactNode; href: string }) => createElement('a', props, children),
}));
vi.mock('../../config', () => ({ featureEnabled: () => false }));
vi.mock('../../components/passkey-verify', () => ({ default: () => createElement('span') }));

afterEach(() => {
    page.props = {};
});

const ACCOUNTS = [{ key: 'owner', label: 'Demo Owner', url: '/users/1/login-as?expires=1&signature=a' }];

it('draws no demo sign-in when the server published neither prop', () => {
    page.props = { canResetPassword: true };
    const html = renderToStaticMarkup(createElement(Login));

    expect(html).not.toContain('Demo sign-in');
    expect(html).not.toContain('any user');
});

it('draws the roster, and no picker, in demo mode alone', () => {
    page.props = { canResetPassword: true, demoAccounts: ACCOUNTS };
    const html = renderToStaticMarkup(createElement(Login));

    expect(html).toContain('Demo sign-in');
    expect(html).toContain('Sign in as Demo Owner');
    expect(html).not.toContain('Sign in as any user');
});

it('draws the any-user picker when the server hands it a search URL', () => {
    page.props = { canResetPassword: true, demoAccounts: ACCOUNTS, demoUserSearchUrl: '/users/demo-search' };
    const html = renderToStaticMarkup(createElement(Login));

    expect(html).toContain('Sign in as Demo Owner');
    expect(html).toContain('Sign in as any user');
    expect(html).toContain('Local development only');
});
