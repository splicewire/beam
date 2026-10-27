// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// EP-42, review-r1 10:47Z: laravel-beam-ux offers the auth islands on every content page (AuthIslandNodeSource), but each
// island's form needs the route that serves its page: the reset form posts the token and email its reset link's route
// hands it, and the two-factor form answers the login that route's session holds open. A palette-placed reset island
// rendered a token-less form on a starter's home page (starter room, 10-27). So an island renders its page on its own
// route, with that route's Inertia props, and anywhere else a stated refusal. The pages are stubbed through the host's
// page map: this pins the island's routing, not the pages.

/** The current Inertia page, as an island reads it. */
const page = vi.hoisted(() => ({ url: '/', props: {} as Record<string, unknown> }));
vi.mock('@inertiajs/react', () => ({ usePage: () => page }));

import { configureBeamInertia } from '../config';
import { defaultComponents } from './registry';

const stub = (name: string) => async () => ({
    default: ((props: Record<string, unknown>) => <form data-testid={`page-${name}`} data-token={String(props.token ?? '')} />) as ComponentType,
});

// Each island, the page it seals, and the route that serves that page (Fortify's default paths, as the starters serve them).
const ISLANDS = [
    { name: 'AuthLogin', page: 'auth/login', url: '/login' },
    { name: 'AuthRegister', page: 'auth/register', url: '/register' },
    { name: 'AuthForgotPassword', page: 'auth/forgot-password', url: '/forgot-password' },
    { name: 'AuthResetPassword', page: 'auth/reset-password', url: '/reset-password/t0k3n?email=a%40b.test' },
    { name: 'AuthConfirmPassword', page: 'auth/confirm-password', url: '/user/confirm-password' },
    { name: 'AuthTwoFactorChallenge', page: 'auth/two-factor-challenge', url: '/two-factor-challenge' },
    { name: 'AuthVerifyEmail', page: 'auth/verify-email', url: '/email/verify' },
];

beforeEach(() => {
    page.url = '/';
    page.props = {};
    configureBeamInertia({ pages: Object.fromEntries(ISLANDS.map((island) => [island.page, stub(island.page)])) });
});
afterEach(() => {
    cleanup();
    configureBeamInertia({});
});

const island = (name: string) => defaultComponents()[name] as ComponentType;

it('registers every auth island with every feature on', () => {
    expect(Object.keys(defaultComponents()).filter((name) => name.startsWith('Auth')).sort()).toEqual(ISLANDS.map((i) => i.name).sort());
});

it.each(ISLANDS)('$name refuses on an ordinary page, rendering no form', ({ name }) => {
    page.url = '/';
    const Island = island(name);
    const { container } = render(<Island />);

    expect(container.querySelector('[data-auth-island-refused]')).not.toBeNull();
    expect(container.querySelector('form')).toBeNull();
});

it.each(ISLANDS)('$name renders its page on its own route', async ({ name, page: pageName, url }) => {
    page.url = url;
    const Island = island(name);
    render(<Island />);

    expect(await screen.findByTestId(`page-${pageName}`)).toBeTruthy();
});

it("the reset island hands its page the route's token and email", async () => {
    page.url = '/reset-password/t0k3n?email=a%40b.test';
    page.props = { token: 't0k3n', email: 'a@b.test' };
    const Island = island('AuthResetPassword');
    render(<Island />);

    expect((await screen.findByTestId('page-auth/reset-password')).getAttribute('data-token')).toBe('t0k3n');
});

it('a route that only begins like an auth route is not that route', () => {
    page.url = '/login-help';
    const Island = island('AuthLogin');
    const { container } = render(<Island />);

    expect(container.querySelector('[data-auth-island-refused]')).not.toBeNull();
});
