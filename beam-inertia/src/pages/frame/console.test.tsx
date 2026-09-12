// @vitest-environment jsdom
/**
 * The Frame console's REALM handling (G3-TOWER-OPERATE / G3-BEAM-FRAME-CONSOLE, measured on
 * fresh-tower.test 2026-09-11–12).
 *
 * `RouteContextProjector::hrefs('operator')` projects `/operator/users`, `/operator/users/:id`,
 * `/operator/teams`, `/operator/teams/:id` from `config('frame.realms')` — and all four 404'd,
 * because every starter builds its `{frameRoute}` console from `hrefs('tenant')` alone. Mounting the
 * operator paths was tried and REVERTED: the console served, and rendered "No surface here".
 *
 * The cause was entirely on the client. The server half is already realm-aware —
 * `NavManifest::realmFor()` reads the route's `defaults['realm']` and its docblock says "a host
 * mounts the same controller once per realm" — while this page fetched a hardcoded `/frame/manifest`
 * and mounted `<BrowserRouter>` with no basename. The realm's `routeContext` paths are realm-RELATIVE
 * (`users`) and its nav hrefs are realm-PREFIXED (`/operator/users`), so at `/operator/users` the
 * router matched neither: one packaged console, one manifest URL, one root basename ⇒ exactly one
 * servable realm per host.
 *
 * The props below are the fix, and they default to today's values, so an existing tenant mount that
 * passes nothing is byte-for-byte what it was — which is the first thing asserted.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `usePage` is read by `useFrameRealm` for the LAYOUT-level readers (the rail, the provider), which
// sit above the page and outside its context. Empty props here: these tests drive the context path.
vi.mock('@inertiajs/react', () => ({ Head: () => null, usePage: () => ({ props: {} }) }));

// The provider and the route table are exercised by their own tests; here they are witnesses that
// report what the page handed them.
vi.mock('../../frame/provider', () => ({
    TenantFrameProvider: ({ children }: { children: unknown }) => <>{children as never}</>,
}));
vi.mock('../../frame/router', async () => {
    const { useLocation } = await import('react-router');

    return {
        FrameRoutes: () => {
            // Rendered INSIDE the BrowserRouter, so what it reports is what react-router actually
            // resolved after applying the basename — not what the page believed it passed.
            const location = useLocation();

            return <div data-testid="routes">{location.pathname}</div>;
        },
    };
});

const fetchMock = vi.fn();

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ resources: [], contexts: {}, nav: { items: [] }, routeContext: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

async function mountConsole(props: Record<string, unknown>, pathname: string) {
    window.history.replaceState({}, '', pathname);

    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const FrameConsole = (await import('./console')).default;

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
        <QueryClientProvider client={client}>
            <FrameConsole {...(props as Record<string, never>)} />
        </QueryClientProvider>,
    );

    return client;
}

describe('frame/console — realm', () => {
    it('defaults to the tenant mount: the root manifest URL and no basename', async () => {
        await mountConsole({}, '/beam-ux-entry');

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(fetchMock.mock.calls[0][0]).toBe('/frame/manifest');

        // Basename-less: the router sees the whole path.
        await waitFor(() => expect(screen.getByTestId('routes').textContent).toBe('/beam-ux-entry'));
    });

    it('serves a non-root realm: its own manifest URL, and the basename stripped before matching', async () => {
        await mountConsole(
            { realm: 'operator', basename: '/operator', manifestUrl: '/operator/frame/manifest' },
            '/operator/users',
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(fetchMock.mock.calls[0][0]).toBe('/operator/frame/manifest');

        // THE DEFECT: without a basename the router was asked to match `/operator/users` against a
        // realm-relative `users` route and matched nothing — "No surface here".
        await waitFor(() => expect(screen.getByTestId('routes').textContent).toBe('/users'));
    });

    it('keeps two realms in separate manifest caches', async () => {
        // One react-query cache key for every realm would have served the operator console the
        // tenant manifest it had already fetched — the same surface, one realm late.
        const client = await mountConsole(
            { realm: 'operator', basename: '/operator', manifestUrl: '/operator/frame/manifest' },
            '/operator/users',
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        const keys = client
            .getQueryCache()
            .getAll()
            .map((q) => JSON.stringify(q.queryKey));

        expect(keys).toContain(JSON.stringify(['frame', 'manifest', 'operator']));
        expect(keys).not.toContain(JSON.stringify(['frame', 'manifest', 'tenant']));
    });

    it('names the realm it failed to load, not a hardcoded URL', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });

        await mountConsole(
            { realm: 'operator', basename: '/operator', manifestUrl: '/operator/frame/manifest' },
            '/operator/users',
        );

        // The old copy said "GET /frame/manifest failed." on every host and every realm, which is a
        // wrong URL in a message whose only job is to name the request that failed.
        await waitFor(() =>
            expect(screen.getByText(/\/operator\/frame\/manifest/)).toBeTruthy(),
        );
    });
});
