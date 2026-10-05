// @vitest-environment jsdom
/**
 * ux-walkthrough UX-04 / IA-7: the satellite's product screen is "Splicewire connection". It reads the pairing as one
 * health line behind "Check connection"; there is no surface to choose and no capability list (that is the developer
 * command `splicewire:connect --check`).
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { PlatformConnectionClient } from './client';
import { PlatformConnectionPanel } from './platform-connection-panel';
import type { PlatformConnection } from './types';

afterEach(cleanup);

const endpoints = { connect: '/c', poll: '/p', check: '/k', disconnect: '/d' };

const paired: PlatformConnection = {
    state: 'paired',
    tokenPresent: true,
    platformUrl: 'https://tower.test',
    centralUrl: 'https://tower.test',
    label: null,
    userCode: null,
    verificationUri: null,
    verificationUriComplete: null,
    expiresAt: null,
    identity: { id: '9', name: 'Demo Admin', email: 'admin@example.test' },
    identityError: null,
};

function client(overrides: Partial<PlatformConnectionClient> = {}): PlatformConnectionClient {
    return {
        connect: vi.fn(),
        poll: vi.fn(async () => paired),
        check: vi.fn(async () => ({ ok: true, status: 200, checkedAt: '2026-10-05T04:00:00Z', error: null })),
        disconnect: vi.fn(),
        ...overrides,
    } as PlatformConnectionClient;
}

it('is the Splicewire connection screen, with no surface picker and no capability list', () => {
    render(<PlatformConnectionPanel connection={paired} endpoints={endpoints} client={client()} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Splicewire connection');
    expect(screen.getByRole('button', { name: 'Check connection' })).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.body.textContent).not.toMatch(/capabilit|circuit-node|chat-tool/i);
});

it('answers a check with one health line', async () => {
    const c = client();
    render(<PlatformConnectionPanel connection={paired} endpoints={endpoints} client={c} />);

    fireEvent.click(screen.getByRole('button', { name: 'Check connection' }));

    await waitFor(() => expect(screen.getByTestId('connection-health').textContent).toMatch(/^The connection works/));
    expect(c.check).toHaveBeenCalledOnce();
});

it('reads the pairing again when the check finds the credential revoked', async () => {
    const c = client({
        check: vi.fn(async () => ({ ok: false, status: 401, checkedAt: '2026-10-05T04:00:00Z', error: 'The platform refused this credential.' })),
        poll: vi.fn(async () => ({ ...paired, state: 'revoked' as const })),
    });
    render(<PlatformConnectionPanel connection={paired} endpoints={endpoints} client={c} />);

    fireEvent.click(screen.getByRole('button', { name: 'Check connection' }));

    await waitFor(() => expect(screen.getByTestId('connection-state-value').textContent).toBe('revoked'));
    expect(screen.getByTestId('connection-health').textContent).toBe('The platform refused this credential.');
});
