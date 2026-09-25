// @vitest-environment jsdom
/**
 * The packaged `error` page (rendered by laravel-beam-accounts' `ErrorPages`): it says what happened,
 * offers a way back, and picks its chrome from the viewer — the account shell for a signed-in viewer,
 * the site shell for a guest or a request with no shared props at all (an unrouted 404).
 */
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
    usePage: () => ({ props: {} }),
}));
vi.mock('../layouts/beam-account-layout', () => ({ default: function AccountShellLayout() { return null; } }));
vi.mock('../layouts/site-layout', () => ({ default: function SiteShellLayout() { return null; } }));

import BeamAccountLayout from '../layouts/beam-account-layout';
import SiteLayout from '../layouts/site-layout';
import ErrorPage from './error';

afterEach(cleanup);

it('shows the status, the server message, and a way home for a signed-in viewer', () => {
    render(
        <ErrorPage
            status={403}
            title="You don’t have access to this page"
            message="This action is unauthorized."
            auth={{ user: { name: 'Demo Member' } }}
        />,
    );

    expect(screen.getByText('Error 403')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'You don’t have access to this page' })).toBeTruthy();
    // Exactly one element carries the sentence: the harness's getByText() is strict.
    expect(screen.getAllByText('This action is unauthorized.')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Go to your dashboard' }).getAttribute('href')).toBe('/dashboard');
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
});

it('sends a guest to the home page', () => {
    render(<ErrorPage status={404} title="Page not found" message="Gone." />);

    expect(screen.getByRole('link', { name: 'Go to the home page' }).getAttribute('href')).toBe('/');
});

it('is an Inertia layout RESOLVER that picks the account shell or the site shell', () => {
    const layout = (ErrorPage as unknown as { layout: (props: unknown) => unknown }).layout;

    // Inertia calls a prototype-less one-argument function with the page props; a function with a
    // prototype would be mounted as the layout component itself.
    expect(layout.length).toBe(1);
    expect(layout.prototype).toBeUndefined();

    expect(layout({ auth: { user: { id: 1 } } })).toBe(BeamAccountLayout);
    expect(layout({ auth: { user: null } })).toBe(SiteLayout);
    expect(layout({})).toBe(SiteLayout);
});
