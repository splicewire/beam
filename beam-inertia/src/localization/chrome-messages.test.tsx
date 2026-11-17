// @vitest-environment jsdom
// localization 28b (the fix the 28b+31 walk demanded, 2026-11-17): the toaster is mounted by withApp BESIDE the Inertia page,
// outside every <BeamMessages>, so its region name was provider-free English ("Notifications alt+T", 83 findings). These
// tests render the REAL withApp tree from beamInertiaOptions() (never a hand-built provider) and drive it with real
// `inertia:navigate` DOM events, the ones Inertia's own router dispatches on every visit.
import { act, cleanup, render } from '@testing-library/react';
import type { ClientCatalog } from '@schemastud/messages';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../hooks/use-flash-toast', () => ({ useFlashToast: () => {} }));
vi.mock('../hooks/use-appearance', () => ({ useAppearance: () => ({ appearance: 'light', updateAppearance: () => {} }), initializeTheme: () => {} }));
// index.tsx loads every layout, and use-mobile reads window.matchMedia at import: stub it first, then import (as brand-title.test)
beforeEach(() => { vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const options = async () => (await import('../index')).beamInertiaOptions();

const KEY = 'splicewire-beam-inertia::messages.chrome_notifications_region';
const catalog = (locale: string, text: string): ClientCatalog => ({ version: 1, locale, realm: null, direction: 'ltr', messages: { [KEY]: { text, sourceLocale: locale } } });
// what the server serves under en-XA: the line already marked (BeamTranslator), the parameter inside the mark
const EN_XA = catalog('en-XA', '⟦Nötïfïcätïôns :hotkey·····⟧');
const DE = catalog('de', 'Benachrichtigungen :hotkey');
const page = (localization: unknown) => ({ component: 'site/home', props: { localization }, url: '/', version: null, clearHistory: false, encryptHistory: false });

const regions = () => [...document.querySelectorAll('section[aria-label]')];
const label = () => regions()[0]?.getAttribute('aria-label') ?? null;
const navigate = (p: unknown) => act(() => { document.dispatchEvent(new CustomEvent('inertia:navigate', { detail: { page: p } })); });
const renderApp = async (initial: unknown) => {
    const o = await options();
    return render(<>{o.withApp(<div data-testid="app" />, { ssr: false, page: page(initial) as never })}</>);
};

it('the REAL withApp tree under the served en-XA catalog: the region name is the MARKED line, shortcut inside', async () => {
    await renderApp({ address: { url: '/c/a', hash: 'h-xa' }, initial: EN_XA });
    expect(label()).toBe('⟦Nötïfïcätïôns alt+T·····⟧');
    expect(regions()).toHaveLength(1);
}, 30_000); // the first import loads the whole shell

it('a LIVE locale switch (a real inertia:navigate with another catalog) changes the name without a remount', async () => {
    await renderApp({ address: { url: '/c/a', hash: 'h-xa' }, initial: EN_XA });
    const region = regions()[0];
    navigate(page({ address: { url: '/c/b', hash: 'h-de' }, initial: DE }));
    expect(label()).toBe('Benachrichtigungen alt+T');
    expect(regions()).toHaveLength(1);
    expect(regions()[0]).toBe(region); // the same element: never remounted, so toasts in flight survive
});

it('a later visit that OMITS the once-prop keeps the catalog for the same hash', async () => {
    await renderApp({ address: { url: '/c/a', hash: 'h-xa' }, initial: EN_XA });
    navigate(page({ address: { url: '/c/a', hash: 'h-xa' }, initial: null }));
    expect(label()).toBe('⟦Nötïfïcätïôns alt+T·····⟧');
    navigate(page({ address: { url: '/c/b', hash: 'h-other' }, initial: null })); // a new hash with no catalog: provider-free
    expect(label()).toBe('Notifications alt+T');
});

// Inertia 3.6.1 fires `navigate` only for a non-replace visit and forces replace for a same-URL one: the language picker's
// PATCH redirects back to the SAME page, so the switch arrives as `success` alone (review of c9e5967d, HIGH 1)
const succeed = (p: unknown) => act(() => { document.dispatchEvent(new CustomEvent('inertia:success', { detail: { page: p } })); });

it('a SAME-URL visit (the language picker; success, no navigate) switches the name, the same element', async () => {
    await renderApp({ address: { url: '/settings/profile', hash: 'h-xa' }, initial: EN_XA });
    const region = regions()[0];
    succeed(page({ address: { url: '/settings/profile', hash: 'h-de' }, initial: DE }));
    expect(label()).toBe('Benachrichtigungen alt+T');
    expect(regions()[0]).toBe(region);
});

it('catalog <-> none never remounts the toaster (one tree shape; review MEDIUM 2)', async () => {
    await renderApp({ address: { url: '/c/a', hash: 'h-xa' }, initial: EN_XA });
    const region = regions()[0];
    navigate(page(null)); // nothing served
    expect(label()).toBe('Notifications alt+T');
    expect(regions()[0]).toBe(region);
    navigate(page({ address: { url: '/c/b', hash: 'h-de' }, initial: DE })); // served again
    expect(label()).toBe('Benachrichtigungen alt+T');
    expect(regions()[0]).toBe(region);
    expect(regions()).toHaveLength(1);
});

it('no catalog served: provider-free English, byte-identical to sonner\'s default', async () => {
    await renderApp(null);
    expect(label()).toBe('Notifications alt+T');
    expect(regions()).toHaveLength(1);
});

it('withApp called the old way (no options) still renders one region (back-compatible signature)', async () => {
    const o = await options();
    render(<>{o.withApp(<div />)}</>);
    expect(regions()).toHaveLength(1);
    expect(label()).toBe('Notifications alt+T');
});
