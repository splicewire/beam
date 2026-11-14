// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ page: { component: 'os', props: { can: { 'os.enter': true }, realmManifest: [
    { key: 'site', title: '', routeBase: '/', locked: false },
    { key: 'user', title: 'Account', routeBase: '/dashboard', locked: false },
    { key: 'operator', title: 'RAW operator', routeBase: '/operator', locked: false },
] } } }));
vi.mock('@inertiajs/react', () => ({ usePage: () => state.page, Link: () => null, router: { visit: vi.fn() } }));
vi.mock('@splicewire/beam-ux/shell', async (load) => {
    const actual = await load<typeof import('@splicewire/beam-ux/shell')>();
    return { ...actual, buildDesktopChrome: vi.fn(actual.buildDesktopChrome) };
});
vi.mock('@schemastud/mainframe', async (load) => {
    const actual = await load<typeof import('@schemastud/mainframe')>();
    return { ...actual, MainframeProvider: ({ children }: { children: ReactNode }) => <>{children}</>, MainframeOutlet: () => null };
});
import { buildDesktopChrome } from '@splicewire/beam-ux/shell';
import { OsShellDesktop, osAppsFromManifest } from './shell-config';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const catalog: ClientCatalog = { version: 1, locale: 'es', realm: null, direction: 'ltr', messages: {
    'splicewire-beam-inertia::messages.surfaces_site': { text: 'Sitio', sourceLocale: 'es' },
    'splicewire-beam-inertia::messages.surfaces_account': { text: 'Cuenta', sourceLocale: 'es' },
    'splicewire-beam-inertia::messages.surfaces_operator': { text: 'Operador', sourceLocale: 'es' },
    'splicewire-beam-inertia::messages.surfaces_account_subtitle': { text: 'Cuenta privada', sourceLocale: 'es' },
} };
it('keeps the exported static helper English and preserves server titles including English lookalikes', () => {
    const apps = osAppsFromManifest(state.page.props.realmManifest);
    expect(apps.map(a => a.title)).toEqual(['Site', 'Account', 'RAW operator']);
    expect(apps[1].subtitle).toBe('Authed · account');
});
it('localizes declared local binding defaults while server titles remain raw on a provider replacement', () => {
    const view = render(<MessageProvider value={{ ...catalog, messages: {} }}><OsShellDesktop /></MessageProvider>);
    expect(vi.mocked(buildDesktopChrome).mock.calls.at(-1)?.[0].apps.map(a => a.title)).toEqual(['Site', 'Account', 'RAW operator']);
    view.rerender(<MessageProvider value={catalog}><OsShellDesktop /></MessageProvider>);
    const apps = vi.mocked(buildDesktopChrome).mock.calls.at(-1)![0].apps;
    expect(apps.map(a => a.title)).toEqual(['Sitio', 'Account', 'RAW operator']);
    expect(apps[1].subtitle).toBe('Cuenta privada');
    expect(apps.map(a => a.route)).toEqual(['/', '/dashboard', '/operator']);
});

it('keeps raw configuration code byte-exact and the same rich nodes when translated slots reorder', () => {
    const previous = state.page;
    state.page = { component: 'os', props: { can: { 'os.enter': false }, realmManifest: [{ key: 'custom', title: 'RAW realm', routeBase: '/custom', locked: false }] } };
    try {
        const english: ClientCatalog = { ...catalog, locale: 'en-US', messages: {} };
        const view = render(<MessageProvider value={english}><OsShellDesktop /></MessageProvider>);
        const code = screen.getByText("SURFACE_MAP['custom']", { selector: 'code' });
        const title = screen.getByText('RAW realm', { selector: 'b' });
        expect(code.parentElement?.textContent).toBe("The RAW realm realm (custom) is registered PHP-side and appears in the manifest, but no /os surface is bound to its key yet. Bind one by adding a SURFACE_MAP['custom'] row.");
        const translated: ClientCatalog = { ...catalog, messages: {
            'splicewire-beam-inertia::messages.surfaces_unbound_realm': { text: 'Move :BINDING before :TITLE for :KEY.', sourceLocale: 'en' },
        } };
        view.rerender(<MessageProvider value={translated} pseudo><OsShellDesktop /></MessageProvider>);
        expect(screen.getByText("SURFACE_MAP['custom']", { selector: 'code' })).toBe(code);
        expect(screen.getByText('RAW realm', { selector: 'b' })).toBe(title);
        expect(code.textContent).toBe("SURFACE_MAP['custom']");
        expect(code.parentElement?.textContent).toContain('⟦');
        expect(code.parentElement?.textContent).not.toMatch(/[\u0000\uFFFC]/u);
    } finally { state.page = previous; }
});
