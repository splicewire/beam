// @vitest-environment jsdom
/**
 * The OPERATOR realm's app chrome (otb-ui-frontier-sidebar DESIGN-01, "Want 2").
 *
 * Measured 2026-08-27 on beam.test/operator: `operator/*` was the only realm with neither its own
 * chrome nor `AppLayout`, so the landing rendered as a bare page with no rail — while the operator
 * realm's nav was already projected server-side at `/operator/frame/manifest` and rendered nowhere.
 *
 * Three things are pinned here, because each has a way to regress that the others cannot see:
 *
 *  - the layout switch gives `operator/*` chrome, and ONLY through the switch (the float invariant in
 *    `index.tsx` — a dock float imports the page module and must stay chrome-free);
 *  - the operator rail asks for the OPERATOR manifest — the tenant `/frame/manifest` would render the
 *    wrong realm's sections beside an operator page, with nothing on screen to say so;
 *  - every other realm's resolution is unchanged, including the tenant rail's manifest.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '../components/ui/tooltip';
import { useFrameRealm } from '../frame/realm';
import { beamInertiaOptions } from '../index';
import AppLayout from './app-layout';
import BeamAccountLayout from './beam-account-layout';
import MainframeHost from './beam-ux/mainframe-host';
import OperatorLayout from './operator-layout';
import OsLayout from './os-layout';
import SettingsLayout from './settings/layout';

// `hooks/use-mobile` reads `window.matchMedia` at MODULE load, and jsdom has none.
vi.hoisted(() => {
    window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
});

const page = vi.hoisted(() => ({
    url: '/operator',
    props: {} as Record<string, unknown>,
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => page,
    Link: ({ href, children, prefetch: _prefetch, ...rest }: Record<string, unknown>) => (
        <a
            href={typeof href === 'string' ? href : (href as { url: string }).url}
            {...(rest as object)}
        >
            {children as never}
        </a>
    ),
}));

const fetchMock = vi.fn();

beforeEach(() => {
    page.url = '/operator';
    page.props = { name: 'Beam', auth: { user: null }, sidebarOpen: true };
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

/** The two providers `beamInertiaOptions().withApp` mounts around every page in a real host. */
function mount(node: ReactNode) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
        <QueryClientProvider client={client}>
            <TooltipProvider delayDuration={0}>{node}</TooltipProvider>
        </QueryClientProvider>,
    );
}

function requestedUrls(): string[] {
    return fetchMock.mock.calls.map(([url]) => String(url));
}

describe('the layout switch', () => {
    const layoutFor = (name: string) => beamInertiaOptions().layout(name);

    it.each(['operator/dashboard', 'operator/platform-connection'])(
        'gives %s the operator app chrome, between the OS overlay and the Mainframe host',
        (name) => {
            expect(layoutFor(name)).toEqual([OsLayout, OperatorLayout, MainframeHost]);
        },
    );

    it('still leaves the self-chromed OS desktop unwrapped', () => {
        expect(layoutFor('os')).toBeNull();
    });

    it('leaves account, settings and the default realm resolving exactly as before', () => {
        expect(layoutFor('account/home')).toEqual([OsLayout, BeamAccountLayout, MainframeHost]);
        expect(layoutFor('settings/profile')).toEqual([
            OsLayout,
            AppLayout,
            SettingsLayout,
            MainframeHost,
        ]);
        expect(layoutFor('frame/console')).toEqual([OsLayout, AppLayout, MainframeHost]);
    });
});

describe('the operator rail', () => {
    it('requests the operator manifest, not the tenant one', async () => {
        mount(
            <OperatorLayout>
                <p>operator page</p>
            </OperatorLayout>,
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(requestedUrls()).toEqual(['/operator/frame/manifest']);
        expect(screen.getByText('operator page')).toBeTruthy();
    });

    it("points the rail's Dashboard item at the operator realm's home", async () => {
        mount(
            <OperatorLayout>
                <p>operator page</p>
            </OperatorLayout>,
        );

        const dashboard = screen.getByText('Dashboard').closest('a');
        expect(dashboard?.getAttribute('href')).toBe('/operator');
    });

    it("renders the operator manifest's sections as the rail", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                resources: [],
                contexts: {},
                routeContext: [],
                nav: {
                    items: [
                        {
                            kind: 'section',
                            title: 'Platform identity',
                            href: null,
                            icon: null,
                            routeName: null,
                            locked: null,
                            children: [
                                {
                                    kind: 'resource',
                                    title: 'Users',
                                    href: '/operator/users',
                                    icon: null,
                                    routeName: 'users.index',
                                    locked: null,
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            }),
        });

        mount(
            <OperatorLayout>
                <p>operator page</p>
            </OperatorLayout>,
        );

        const users = await screen.findByText('Users');
        expect(users.closest('a')?.getAttribute('href')).toBe('/operator/users');
    });

    it('does not hand the operator realm to the PAGE — only the rail is scoped', async () => {
        function Witness() {
            return <p data-testid="page-realm">{String(useFrameRealm().realm)}</p>;
        }

        mount(
            <OperatorLayout>
                <Witness />
            </OperatorLayout>,
        );

        expect(screen.getByTestId('page-realm').textContent).toBe('null');
    });
});

describe('the tenant rail', () => {
    it('is unchanged: AppLayout requests /frame/manifest and Dashboard stays /dashboard', async () => {
        page.url = '/dashboard';

        mount(
            <AppLayout>
                <p>tenant page</p>
            </AppLayout>,
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(requestedUrls()).toEqual(['/frame/manifest']);
        expect(screen.getByText('Dashboard').closest('a')?.getAttribute('href')).toBe('/dashboard');
    });

    it("follows a frame console's page-prop realm, so /operator/users' rail and home agree", async () => {
        page.url = '/operator/users';
        page.props = {
            ...page.props,
            realm: 'operator',
            basename: '/operator',
            manifestUrl: '/operator/frame/manifest',
        };

        mount(
            <AppLayout>
                <p>console</p>
            </AppLayout>,
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(requestedUrls()).toEqual(['/operator/frame/manifest']);
        expect(screen.getByText('Dashboard').closest('a')?.getAttribute('href')).toBe('/operator');
    });
});
