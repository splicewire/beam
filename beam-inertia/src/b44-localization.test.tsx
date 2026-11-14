// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import { createMessages, type ClientCatalog } from '@schemastud/messages';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import defaults from './messages.defaults.json';
import { surfaceMessage } from './os/surface-message';
import { useBeamMessages } from './messages';

vi.mock('@inertiajs/react', () => ({
    Form: ({ children }: { children: (state: object) => ReactNode }) => <form>{children({ errors: {}, processing: false, clearErrors: vi.fn() })}</form>,
    Link: ({ children, ...props }: { children: ReactNode }) => <a {...props}>{children}</a>,
    usePage: () => ({ props: {} }), setLayoutProps: vi.fn(),
}));
vi.mock('./components/ui/input-otp', () => ({
    InputOTP: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    InputOTPGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    InputOTPSlot: () => null,
}));
import ForgotPassword from './pages/auth/forgot-password';
import TwoFactorChallenge from './pages/auth/two-factor-challenge';
import PasskeyItem from './components/passkey-item';
afterEach(cleanup);
const catalog: ClientCatalog = { version: 1, locale: 'de', realm: null, direction: 'ltr', messages: {} };
const ns = 'splicewire-beam-inertia::messages.';

it('restores the exact English span and link siblings on the real forgot-password page', () => {
    render(<ForgotPassword />);
    const link = screen.getByText('log in');
    expect(link.parentElement?.innerHTML).toBe('<span>Or, return to</span><a class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500" href="/login">log in</a>');
    expect(link.parentElement?.childNodes.length).toBe(2);
});

it('restores the exact English span and button siblings on the real two-factor page', () => {
    render(<TwoFactorChallenge />);
    const button = screen.getByText('login using a recovery code');
    expect(button.previousSibling?.nodeName).toBe('SPAN');
    expect(button.previousSibling?.textContent).toBe('or you can ');
    expect(button.parentElement?.childNodes.length).toBe(2);
});

it('lets translated auth sentences reorder their rich action while retaining the span', () => {
    render(<MessageProvider value={{ ...catalog, messages: { [ns + 'auth_return_to_login']: { text: ':action zurück', sourceLocale: 'de' } } }} pseudo><ForgotPassword /></MessageProvider>);
    const link = screen.getByText(/lôg ïn/);
    expect(link.parentElement?.querySelector('span')?.textContent).toContain('⟦');
    expect(link.parentElement?.textContent).not.toMatch(/[\u0000\uFFFC]/u);
});

function Emphasis() {
    const m = useBeamMessages();
    return <p>{surfaceMessage(m, 'splicewire-beam-inertia::messages.surfaces_connection_disconnect_explanation', {}, children => <strong>{children}</strong>)}</p>;
}
it('translates emphasis inside a complete sentence instead of translating an isolated word', () => {
    const view = render(<Emphasis />);
    expect(document.querySelector('strong')?.textContent).toBe('not');
    expect(document.querySelector('p')?.textContent).toBe('Clears the credential stored on this site. It does not revoke the credential at the tower — revoke it there too, or anyone holding a copy can still use it.');
    view.rerender(<MessageProvider value={{ ...catalog, messages: { [ns + 'surfaces_connection_disconnect_explanation']: { text: ':EMPHASIS_STARTganzer Satz:EMPHASIS_END bleibt.', sourceLocale: 'de' } } }} pseudo><Emphasis /></MessageProvider>);
    expect(document.querySelector('strong')?.textContent).toContain('gánzër Sátz');
    expect(document.querySelector('p')?.textContent).not.toMatch(/[\u0000\uFFFC]/u);
});

it('uses choice while preserving the legacy English one-realms bytes', () => {
    const key = 'splicewire-beam-inertia::messages.surfaces_desktop_status';
    const english = createMessages(defaults);
    for (const count of [0, 1, 2]) expect(english.choice(key, count)).toBe(`${count} realms · window manager live · layout persists per session`);
    const translated = createMessages(defaults, { catalog: { ...catalog, messages: { [key]: { text: '{1} :count Bereich|[0,*] :count Bereiche', sourceLocale: 'de' } } } });
    expect(translated.choice(key, 1)).toBe('1 Bereich');
    expect(translated.choice(key, 2)).toBe('2 Bereiche');
});

it('renders a malformed missing passkey date empty as base JSX did instead of throwing', () => {
    const passkey = JSON.parse('{"id":7,"name":"RAW key"}');
    expect(() => render(<PasskeyItem passkey={passkey} onDelete={vi.fn()} />)).not.toThrow();
    expect(screen.getByText('RAW key').parentElement?.nextElementSibling?.textContent).toBe('Added ');
});
