// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import { afterEach, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('@inertiajs/react', () => ({ useHttp: () => http }));
import { useTwoFactorAuth } from './use-two-factor-auth';

function Fixture() {
    const auth = useTwoFactorAuth();
    return <><button onClick={auth.fetchQrCode}>Fetch</button><output>{auth.errors.join('|')}</output></>;
}
const key = 'splicewire-beam-inertia::messages.auth_failed_to_fetch_qr_code';
const catalog = (text?: string): ClientCatalog => ({
    version: 1, locale: 'en-US', realm: null, direction: 'ltr',
    messages: text ? { [key]: { text, sourceLocale: 'en' } } : {},
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('keeps English fallback errors without a provider', async () => {
    http.submit.mockRejectedValueOnce(new Error('RAW transport error'));
    render(<Fixture />);
    fireEvent.click(screen.getByRole('button', { name: 'Fetch' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Failed to fetch QR code'));
    expect(http.submit).toHaveBeenCalledWith({ method: 'get', url: '/user/two-factor-qr-code' });
});

it('updates an already visible fallback error on a provider change without another request', async () => {
    http.submit.mockRejectedValueOnce(new Error('RAW transport error'));
    const view = render(<MessageProvider value={catalog()}><Fixture /></MessageProvider>);
    const output = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: 'Fetch' }));
    await waitFor(() => expect(output.textContent).toBe('Failed to fetch QR code'));
    view.rerender(<MessageProvider value={catalog('Cannot load QR')} pseudo><Fixture /></MessageProvider>);
    expect(screen.getByRole('status')).toBe(output);
    expect(output.textContent).toContain('⟦');
    expect(output.textContent).not.toBe('Failed to fetch QR code');
    expect(http.submit).toHaveBeenCalledTimes(1);
});
