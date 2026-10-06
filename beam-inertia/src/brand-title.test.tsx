// @vitest-environment jsdom
/**
 * UX-03b: Inertia now serialises the first page into `<script data-page="app" type="application/json">`, not
 * `#app[data-page]`, so the title callback never found the shared brand: it fell back to the build-time
 * `VITE_APP_NAME` ("Log in - Laravel"), and with that fallback gone, to a bare "Log in".
 */
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
});

const brand = { name: 'Acme', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '' };

it('titles pages from the brand in the server-rendered page script', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    document.body.innerHTML = `<script data-page="app" type="application/json">${JSON.stringify({ props: { brand } })}</script><div id="app"></div>`;
    const { beamInertiaOptions } = await import('./index');

    expect(beamInertiaOptions({}).title('Log in')).toBe('Log in - Acme');
}, 30_000); // the first import loads the whole shell, which takes seconds under a full parallel run

it('still reads an #app[data-page] page', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    document.body.innerHTML = `<div id="app" data-page='${JSON.stringify({ props: { brand } })}'></div>`;
    const { beamInertiaOptions } = await import('./index');

    expect(beamInertiaOptions({}).title('Log in')).toBe('Log in - Acme');
});
