// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AcceptInvitation from './accept-invitation';

/* localization 69b: the page hands the server's `roleLabel` (AcceptInvitationPageData) to the panel beside `role`. */
const state = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => ({ props: state.props }),
    router: { post: vi.fn() },
}));
vi.mock('@splicewire/beam-accounts', () => ({
    AcceptInvitationPanel: ({ role, roleLabel }: { role?: string | null; roleLabel?: string | null }) =>
        <p data-testid="panel">{`${String(role)}|${String(roleLabel)}`}</p>,
}));
afterEach(cleanup);

function renderPage(props: Record<string, unknown>): string {
    state.props = { state: 'ready', viewerEmail: null, acceptUrl: null, logoutUrl: null, ...props };
    render(<QueryClientProvider client={new QueryClient()}><AcceptInvitation /></QueryClientProvider>);
    return screen.getByTestId('panel').textContent ?? '';
}

it('passes the server role label to the panel', () => {
    expect(renderPage({ role: 'admin', roleLabel: 'Administrateur' })).toBe('admin|Administrateur');
});

it('passes no label when the server sends none, so the panel keeps its own fallback', () => {
    expect(renderPage({ role: 'admin' })).toBe('admin|undefined');
});
