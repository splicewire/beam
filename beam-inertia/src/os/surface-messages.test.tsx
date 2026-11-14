// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClientCatalog } from '@schemastud/messages';
import { PageProperties } from './page-properties';
import { PlatformConnectionPanel } from '../platform/platform-connection-panel';
import type { PlatformConnectionClient } from '../platform/client';
import type { PlatformConnection, PlatformConnectionEndpoints } from '../platform/types';

vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: {} }) }));
afterEach(cleanup);
const catalog: ClientCatalog = { version: 1, locale: 'en-XA', realm: null, direction: 'ltr', messages: {} };
const endpoints: PlatformConnectionEndpoints = { connect: '/connect', poll: '/poll', check: '/check', disconnect: '/disconnect' };
const connection: PlatformConnection = {
    state: 'paired', centralUrl: null, platformUrl: 'https://raw-tower.example', tokenPresent: true,
    identity: { id: 'raw-id', name: 'RAW NAME', email: 'raw@example.test' }, label: 'RAW LABEL',
    identityError: null, userCode: null, verificationUri: null, verificationUriComplete: null, expiresAt: null,
};
const properties = { slug: 'raw-slug', editable: true, editing: false, onEditContent: vi.fn(), onExitContent: vi.fn() };

describe('surface messages', () => {
    it('keeps exact English sentences, rich elements and callbacks with no provider', () => {
        render(<PageProperties {...properties} />);
        expect(screen.getByText('Open the raw-slug page to edit its entry here.').textContent).toBe('Open the raw-slug page to edit its entry here.');
        expect(document.querySelector('.pp-meta span')?.innerHTML).toBe('slug <b>raw-slug</b>');
        expect(screen.getByRole('button', { name: '✎ Edit content' }).textContent?.trim()).toBe('✎ Edit content');
        fireEvent.click(screen.getByRole('button', { name: '✎ Edit content' }));
        expect(properties.onEditContent).toHaveBeenCalledOnce();
    });

    it('uses real pseudo messages while retaining raw identity, label and URL values', () => {
        render(<MessageProvider value={catalog} pseudo><PlatformConnectionPanel connection={connection} endpoints={endpoints} /></MessageProvider>);
        expect(screen.getByTestId('connection-state').textContent).toMatch(/^⟦/u);
        expect(screen.getByTestId('platform-identity').textContent).toContain('RAW NAME (raw@example.test)');
        expect(screen.getByText('RAW LABEL').textContent).toBe('RAW LABEL');
        expect(screen.getByTestId('platform-url').textContent).toBe('https://raw-tower.example');
        expect(screen.getByTestId('platform-connection').querySelector('strong')?.textContent).toMatch(/^⟦/u);
        expect(screen.getByTestId('connection-state-value').textContent).toBe('paired');
    });

    it('updates the existing editable nodes when the provider changes without resetting input state', () => {
        const view = render(<MessageProvider value={catalog}><PlatformConnectionPanel connection={connection} endpoints={endpoints} /></MessageProvider>);
        const input = screen.getByTestId('pairing-label');
        const heading = screen.getByRole('heading', { name: 'Splicewire connection' });
        fireEvent.change(input, { target: { value: 'MY LABEL' } });
        view.rerender(<MessageProvider value={catalog} pseudo><PlatformConnectionPanel connection={connection} endpoints={endpoints} /></MessageProvider>);
        expect(screen.getByTestId('pairing-label')).toBe(input);
        expect(input).toHaveProperty('value', 'MY LABEL');
        expect(heading.isConnected).toBe(true);
        expect(heading.textContent).toMatch(/^⟦/u);
    });

    it('reorders a whole rich sentence and keeps uppercase slot aliases opaque', () => {
        const translated: ClientCatalog = { ...catalog, messages: {
            'splicewire-beam-inertia::messages.surfaces_slug': { text: ':SLUG — slug', sourceLocale: 'en' },
            'splicewire-beam-inertia::messages.surfaces_open_entry': { text: 'Edit :slug here.', sourceLocale: 'en' },
        } };
        const view = render(<MessageProvider value={catalog}><PageProperties {...properties} /></MessageProvider>);
        const bold = document.querySelector('.pp-meta b');
        view.rerender(<MessageProvider value={translated}><PageProperties {...properties} /></MessageProvider>);
        expect(document.querySelector('.pp-meta b')).toBe(bold);
        expect(document.querySelector('.pp-meta span')?.textContent).toBe('raw-slug — slug');
        expect(screen.getByText('Edit raw-slug here.')).toBeTruthy();
    });

    it('preserves English disconnect emphasis and whole-sentence spacing', () => {
        render(<PlatformConnectionPanel connection={connection} endpoints={endpoints} />);
        const emphasis = screen.getByText('not', { selector: 'strong' });
        expect(emphasis.parentElement?.textContent).toBe('Clears the credential stored on this site. It does not revoke the credential at the tower — revoke it there too, or anyone holding a copy can still use it.');
        expect(screen.getByTestId('platform-identity').textContent).toBe('RAW NAME (raw@example.test)');
    });
});

it('updates an already-visible local fallback without retrying while raw diagnostics remain exact', async () => {
    const check = vi.fn().mockRejectedValue('non-Error diagnostic');
    const client: PlatformConnectionClient = { connect: vi.fn(), poll: vi.fn(), check, disconnect: vi.fn() };
    const english: ClientCatalog = { ...catalog, locale: 'en-US' };
    const view = render(<MessageProvider value={english}><PlatformConnectionPanel connection={connection} endpoints={endpoints} client={client} /></MessageProvider>);
    fireEvent.click(screen.getByTestId('check-connection'));
    await waitFor(() => expect(screen.getByTestId('panel-error').textContent).toBe('Something went wrong.'));
    const panel = screen.getByTestId('panel-error');
    view.rerender(<MessageProvider value={catalog} pseudo><PlatformConnectionPanel connection={connection} endpoints={endpoints} client={client} /></MessageProvider>);
    expect(screen.getByTestId('panel-error')).toBe(panel);
    expect(panel.textContent).toMatch(/^⟦/u);
    expect(check).toHaveBeenCalledTimes(1);
    check.mockRejectedValueOnce(new Error('RAW remote :detail.'));
    fireEvent.click(screen.getByTestId('check-connection'));
    await waitFor(() => expect(screen.getByTestId('panel-error').textContent).toBe('RAW remote :detail.'));
    view.rerender(<MessageProvider value={english}><PlatformConnectionPanel connection={connection} endpoints={endpoints} client={client} /></MessageProvider>);
    expect(screen.getByTestId('panel-error').textContent).toBe('RAW remote :detail.');
});
