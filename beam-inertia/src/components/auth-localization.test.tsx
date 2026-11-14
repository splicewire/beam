// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

const observed = vi.hoisted(() => ({ layout: vi.fn(), updateAppearance: vi.fn() }));
vi.mock('@inertiajs/react', () => ({
    Form: ({ children }: { children: (state: { errors: Record<string, string>; processing: boolean }) => ReactNode }) =>
        <form>{children({ errors: { email: 'SERVER email error' }, processing: false })}</form>,
    Head: () => null,
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
    setLayoutProps: observed.layout,
    usePage: () => ({ props: { auth: { user: { name: 'RAW Name', email: 'raw@example.test', email_verified_at: '2026-01-01' } } } }),
}));
vi.mock('../config', () => ({ featureEnabled: () => false }));
vi.mock('./delete-user', () => ({ default: () => null }));
vi.mock('../hooks/use-appearance', () => ({ useAppearance: () => ({ appearance: 'system', updateAppearance: observed.updateAppearance }) }));

import AppearanceTabs from './appearance-tabs';
import PasswordInput from './password-input';
import PasskeyItem from './passkey-item';
import Profile from '../pages/settings/profile';

const ns = 'splicewire-beam-inertia::messages.auth_';
function catalog(translations: Record<string, string> = {}): ClientCatalog {
    return { version: 1, locale: 'en-US', realm: null, direction: 'ltr', messages: Object.fromEntries(Object.entries(translations).map(([key, text]) => [ns + key, { text, sourceLocale: 'en' }])) };
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('retains no-provider English password and appearance controls', () => {
    render(<><PasswordInput aria-label="RAW input" defaultValue="secret" /><AppearanceTabs /></>);
    const input = screen.getByLabelText('RAW input');
    expect(input.getAttribute('type')).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
    expect(input.getAttribute('type')).toBe('text');
    expect(screen.getByRole('button', { name: 'System' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(observed.updateAppearance).toHaveBeenCalledWith('dark');
});

it('updates password labels in a real provider without remounting or resetting local state', () => {
    const view = render(<MessageProvider value={catalog()}><PasswordInput aria-label="RAW input" /></MessageProvider>);
    const input = screen.getByLabelText('RAW input');
    fireEvent.change(input, { target: { value: 'retained' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    view.rerender(<MessageProvider value={catalog({ hide_password: 'Conceal password' })} pseudo><PasswordInput aria-label="RAW input" /></MessageProvider>);
    expect(screen.getByLabelText('RAW input')).toBe(input);
    expect((input as HTMLInputElement).value).toBe('retained');
    expect(input.getAttribute('type')).toBe('text');
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('⟦');
    expect(screen.getByRole('button').getAttribute('aria-label')).not.toBe('Hide password');
});

it('localizes complete passkey dates while keeping server labels and dates raw', () => {
    const passkey = { id: 7, name: 'RAW passkey', authenticator: 'RAW Authenticator', createdAtDiff: 'RAW date', lastUsedAtDiff: 'RAW last use' };
    render(<MessageProvider value={catalog({ passkey_added: ':date, added' })} pseudo><PasskeyItem passkey={passkey} onDelete={vi.fn()} /></MessageProvider>);
    expect(screen.getByText('RAW passkey')).toBeTruthy();
    expect(screen.getByText('RAW Authenticator')).toBeTruthy();
    expect(screen.getByText(/RAW date/).textContent).toContain('⟦');
    expect(screen.getByText(/RAW date/).textContent).toContain('RAW last use');
    expect(screen.getByText(/RAW date/).textContent).not.toContain(':date');
});

const profile = <Profile entry={null} mustVerifyEmail={false} status={null} preferredLocale="es" supportedLocales={['en', 'es']} />;
it('retains static English metadata while current profile breadcrumbs and language copy follow the provider', () => {
    render(profile);
    expect(Profile.layout.breadcrumbs[0].title).toBe('Profile settings');
    expect(observed.layout).toHaveBeenLastCalledWith({ breadcrumbs: [{ title: 'Profile settings', href: { method: 'get', url: '/settings/profile' } }] });
    expect(screen.getByLabelText('Language')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Automatic' })).toBeTruthy();
    cleanup();
    const view = render(<MessageProvider value={catalog()}>{profile}</MessageProvider>);
    const select = screen.getByLabelText('Language');
    view.rerender(<MessageProvider value={catalog({ profile_settings: 'Account details', language: 'Preferred language', automatic: 'Automatic choice' })} pseudo>{profile}</MessageProvider>);
    expect(screen.getByRole('combobox')).toBe(select);
    expect((select as HTMLSelectElement).value).toBe('es');
    expect(screen.getByText('SERVER email error')).toBeTruthy();
    expect(screen.getByDisplayValue('RAW Name')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'español' })).toBeTruthy();
    expect(screen.getByRole('option', { name: /⟦/ })).toBeTruthy();
    expect(observed.layout.mock.calls.at(-1)?.[0].breadcrumbs[0].title).toContain('⟦');
    expect(Profile.layout.breadcrumbs[0].title).toBe('Profile settings');
});
