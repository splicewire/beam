// S1 (owner-review-20261026 ticket 01; owner-review-20261102 research 22 addendum): the login page's demo sign-in.
// The roster draws only what the server published, the "any user" picker only when the server handed it a search URL
// (or the host a transport), and a choice goes to the host's onSelect, defaulting to a full GET of the signed link.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DemoLogin, fetchDemoUsers, LoginPanel, AuthProvider } from '../src/index';
import type { AuthClient, DemoLoginChoice, DemoLoginUser } from '../src/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

const ACCOUNTS = [
    { key: 'owner', label: 'Demo Owner', url: '/users/1/login-as?expires=1&signature=a' },
    { key: 'member', label: 'Demo Member', url: '/users/2/login-as?expires=1&signature=b' },
];

const USERS: DemoLoginUser[] = [
    { id: 'u-ada', name: 'Ada Lovelace', email: 'ada@example.test', url: '/users/u-ada/login-as?expires=1&signature=c' },
    { id: 'u-grace', name: 'Grace Hopper', email: 'grace@navy.example', url: '/users/u-grace/login-as?expires=1&signature=d' },
];

describe('DemoLogin', () => {
    it('draws nothing when the server published neither a roster nor a search URL', () => {
        const { container } = render(<DemoLogin accounts={[]} searchUrl={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('draws the roster without a picker when only demo mode is on', () => {
        render(<DemoLogin accounts={ACCOUNTS} />);

        expect(screen.getByRole('heading', { name: 'Demo sign-in' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Sign in as Demo Owner' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Sign in as Demo Member' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: /any user/i })).toBeNull();
    });

    it('hands a roster choice to onSelect', () => {
        const onSelect = vi.fn();
        render(<DemoLogin accounts={ACCOUNTS} onSelect={onSelect} />);

        fireEvent.click(screen.getByRole('button', { name: 'Sign in as Demo Member' }));

        expect(onSelect).toHaveBeenCalledWith({ kind: 'account', ...ACCOUNTS[1] });
    });

    it('searches any user through the injected transport and hands the chosen user to onSelect', async () => {
        const search = vi.fn(async (query: string) => USERS.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())));
        const onSelect = vi.fn<(choice: DemoLoginChoice) => void>();
        render(<DemoLogin search={search} onSelect={onSelect} />);

        fireEvent.click(screen.getByRole('button', { name: /sign in as any user/i }));
        // Opening lists the roster (an empty query) …
        expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
        expect(screen.getByText('grace@navy.example')).toBeTruthy();

        // … and typing narrows it.
        fireEvent.change(screen.getByLabelText('Search by name or email'), { target: { value: 'grace' } });
        await waitFor(() => expect(search).toHaveBeenLastCalledWith('grace'));
        const grace = await screen.findByRole('option', { name: /Grace Hopper/ });
        expect(screen.queryByText('Ada Lovelace')).toBeNull();

        fireEvent.click(grace);

        expect(onSelect).toHaveBeenCalledWith({ kind: 'user', ...USERS[1] });
    });

    it('defaults the transport to a same-origin GET of the search URL, unwrapping the envelope', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { users: USERS } }), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const users = await fetchDemoUsers('/users/demo-search')('  ada ');

        expect(users).toEqual(USERS);
        const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
        expect(url.pathname).toBe('/users/demo-search');
        expect(url.searchParams.get('q')).toBe('ada');
        expect(init.credentials).toBe('same-origin');
    });

    it('treats a refused search (gate closed after render) as no results, not an error', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));

        expect(await fetchDemoUsers('/users/demo-search')('')).toEqual([]);
    });

    it('mounts in LoginPanel\'s existing footer slot', () => {
        const client: AuthClient = { login: vi.fn(), requestPasswordReset: vi.fn(), resetPassword: vi.fn() };
        render(
            <QueryClientProvider client={new QueryClient()}>
                <AuthProvider services={{ client }}>
                    <LoginPanel onSuccess={() => {}} footer={<DemoLogin accounts={ACCOUNTS} searchUrl="/users/demo-search" />} />
                </AuthProvider>
            </QueryClientProvider>,
        );

        expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Sign in as Demo Owner' })).toBeTruthy();
        expect(screen.getByRole('button', { name: /sign in as any user/i })).toBeTruthy();
    });
});
