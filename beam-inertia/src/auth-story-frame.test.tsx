// @vitest-environment jsdom
/**
 * The Inertia/Auth/Login and Register baselines showed a bare form with the passkey button at the top edge
 * (launch ticket 05 item 5). The product already opens those pages with the brand mark and a heading: the
 * AuthLayout logo, then the entry tree's own h1/p (seeded by AuthPagesSeeder, or editor/defaults.ts
 * DEFAULT_TREES on an unseeded host). The stories rendered only the island. AuthStoryFrame frames a story
 * the way the app does, with the heading taken from the same default tree (never a copy).
 */
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
    usePage: () => ({ props: {} }),
}));
vi.mock('./components/app-logo-icon', () => ({ default: () => <svg data-testid="brand-mark" /> }));

import { AuthStoryFrame } from './story-harness';

afterEach(cleanup);

it.each([
    ['login', 'Log in to your account', 'Enter your email and password below to log in'],
    ['register', 'Create an account', 'Enter your details below to create your account'],
])('frames the %s story with the brand mark and the default tree heading', (slug, heading, description) => {
    render(<AuthStoryFrame slug={slug}>island</AuthStoryFrame>);

    expect(screen.getByTestId('brand-mark')).toBeTruthy();
    expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    expect(screen.getByText(description)).toBeTruthy();
    expect(screen.getByText('island')).toBeTruthy();
});
