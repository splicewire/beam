// @vitest-environment jsdom
/**
 * The `{realm}-dashboard` leaf renders CARDS through the manifest router with no bespoke page
 * (realm-dashboards ticket 04).
 *
 * The server registers one read-only `{realm}-dashboard` resource per realm whose row Data binds the
 * root `list-item` to `dashboard-card`, and projects its leaf as an ordinary `mounts: 'list'` entry.
 * `FrameRoutes` already mounts every such leaf as `<ListShell columns={[]} …>`; what turns that shell
 * from a table into a grid of cards is the injection `TenantFrameProvider` builds — the card set in
 * the registry and `manifestFor` for resolving a row's TARGET resource. This test drives the real
 * provider and the real router over a hand-built manifest and a mocked transport, so a regression in
 * either wiring (a card set not registered, a lookup not on the injection) shows as a missing card.
 *
 * Three things a dashboard row can be, and one it must survive:
 *  - a `summary` row of a resource that participates in `summary` ⇒ a stat-row;
 *  - an `overview` row whose target inherits `overview ← summary` ⇒ a figure-card;
 *  - a `nav` row ⇒ a nav tile, no manifest lookup at all;
 *  - a row naming a resource this host does NOT mount ⇒ nothing rendered, nothing thrown, and every
 *    other card still on screen (nav-contribution PLAN: contributed nodes drop).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { KNOWN_CONTEXTS } from '@schemastud/frame';
import type {
    ContextManifest,
    DashboardRow,
    FrameTransport,
    Paginated,
    Row,
} from '@schemastud/frame';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FrameManifest } from './manifest';
import { FrameRealmProvider } from './realm';
import { TenantFrameProvider } from './provider';
import { FrameRoutes } from './router';

// `usePage` is read by `useFrameRealm` below the explicit realm provider these tests mount, so
// empty props are never consulted; `Link`/`router` are what the router file imports.
vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => ({ props: {} }),
    Link: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
    router: { visit: vi.fn() },
}));

// The transport is the one seam a unit test owns: `list` answers the rows below for whichever
// resource the shell asks about; the facets methods answer "no filters" so the shell mounts at all.
const transport = vi.hoisted(() => ({
    rows: [] as Row[],
    list: vi.fn(),
}));

vi.mock('./transport', () => {
    const frameTransport = {
        getFilterSchema: vi.fn(async () => ({ type: 'object', properties: {} })),
        getFilterVariants: vi.fn(async (resource: string) => ({ resource, variants: [] })),
        getFilterOptions: vi.fn(async () => []),
        getSavedFilters: vi.fn(async () => []),
        saveFilter: vi.fn(async () => ({
            id: '1',
            name: 'v',
            resource: 'x',
            query_parameters: {},
            visibility: 'private',
            is_default: false,
        })),
        deleteSavedFilter: vi.fn(async () => undefined),
        list: transport.list,
        get: vi.fn(async (_r: string, id: string) => ({ id })),
        getFormSchema: vi.fn(async () => ({ type: 'object', properties: {} })),
        save: vi.fn(async (_r: string, id: string | null, data: unknown) => ({ id: id ?? '3', ...(data as Row) })),
        remove: vi.fn(async () => undefined),
    } as unknown as FrameTransport;

    return { frameTransport };
});

const manifestState = vi.hoisted(() => ({ current: undefined as unknown }));

// The provider reads the manifest through `useFrameManifest`; the router is handed it as a prop.
// Both get the SAME hand-built object, exactly as the console page arranges it.
vi.mock('./manifest', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./manifest')>()),
    useFrameManifest: () => ({ data: manifestState.current, isLoading: false, error: null }),
}));

const known = KNOWN_CONTEXTS;

/** The realm's dashboard resource: root `list-item` bound to `dashboard-card`, no columns. */
const DASHBOARD: ContextManifest = {
    byNode: { '': { 'list-item': { participates: true, widget: 'dashboard-card' } } },
    inherits: {},
    known,
};

/** A seated resource declaring only `summary`. */
const USERS: ContextManifest = {
    byNode: { '': { summary: { participates: true } } },
    inherits: { overview: ['summary'] },
    known,
};

/** A seated resource declaring `overview`, which cascades from `summary` for its binding. */
const TEAMS: ContextManifest = {
    byNode: { '': { summary: { participates: true }, overview: { participates: true } } },
    inherits: { overview: ['summary'] },
    known,
};

const seat = (key: string, label: string, icon: string | null) => ({
    key,
    creatable: false,
    editable: false,
    deletable: false,
    showable: false,
    nav: { label, group: null, icon },
});

const MANIFEST: FrameManifest = {
    resources: [
        seat('operator-dashboard', 'Dashboard', 'layout-dashboard'),
        seat('users', 'Users', 'users'),
        seat('teams', 'Teams', 'building'),
    ],
    contexts: { 'operator-dashboard': DASHBOARD, users: USERS, teams: TEAMS },
    nav: { items: [] },
    routeContext: [
        {
            routeName: 'operator-dashboard.index',
            path: 'dashboard',
            shell: null,
            lazy: false,
            guard: null,
            mounts: 'list',
            resource: 'operator-dashboard',
        },
    ],
};

const ROWS: DashboardRow[] = [
    {
        resource: 'users',
        context: 'summary',
        navOrder: 1,
        label: 'Users',
        icon: 'users',
        href: '/operator/users',
        summary: {
            key: 'users',
            label: 'Users',
            icon: 'users',
            figures: [{ key: 'total', label: 'Total', value: 42 }],
            overview: null,
        },
    },
    {
        resource: 'teams',
        context: 'overview',
        navOrder: 2,
        label: 'Teams',
        icon: 'building',
        href: '/operator/teams',
        summary: {
            key: 'teams',
            label: 'Teams',
            icon: 'building',
            figures: [{ key: 'total', label: 'Total', value: 7, tone: 'active' }],
            overview: { headline: { key: 'active', label: 'Active', value: 5 }, items: [], period: '30d', note: null },
        },
    },
    {
        resource: 'operator-users',
        context: 'nav',
        navOrder: 3,
        label: 'Manage users',
        icon: 'users',
        href: '/operator/users',
        description: 'Every account on the platform',
        summary: null,
    },
];

beforeEach(() => {
    manifestState.current = MANIFEST;
    transport.list.mockImplementation(
        async (): Promise<Paginated<Row>> => ({
            data: transport.rows,
            total: transport.rows.length,
            page: 1,
            perPage: 25,
        }),
    );
});

afterEach(() => {
    cleanup();
    transport.list.mockReset();
});

function mountLeaf(rows: DashboardRow[]) {
    transport.rows = rows as unknown as Row[];

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return render(
        <QueryClientProvider client={client}>
            <FrameRealmProvider realm="operator" basename="/operator" manifestUrl="/operator/frame/manifest">
                <TenantFrameProvider>
                    <MemoryRouter basename="/operator" initialEntries={['/operator/dashboard']}>
                        <FrameRoutes manifest={MANIFEST} />
                    </MemoryRouter>
                </TenantFrameProvider>
            </FrameRealmProvider>
        </QueryClientProvider>,
    );
}

const cells = (container: HTMLElement) => container.querySelectorAll('[data-frame-slot="Cards"] [data-frame-card-cell]');

describe('the {realm}-dashboard leaf through the manifest router', () => {
    it('renders one card per row through the list shell — no table, no bespoke page', async () => {
        const { container } = mountLeaf(ROWS);

        await waitFor(() => expect(cells(container)).toHaveLength(ROWS.length));
        expect(transport.list).toHaveBeenCalledWith('operator-dashboard', expect.anything());

        // The leaf is titled from the manifest, like every other dispatched list leaf.
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();

        // Cards, not rows: the table path was never taken.
        expect(container.querySelector('table')).toBeNull();
        expect(screen.queryAllByRole('columnheader')).toHaveLength(0);

        // Each row went through `dashboard-card` to its target's own entry.
        const users = container.querySelector('[data-frame-card-resource="users"]');
        expect(users?.querySelector('[data-frame-card="stat-row"]')).toBeTruthy();
        expect(screen.getByText('42')).toBeTruthy();

        const teams = container.querySelector('[data-frame-card-resource="teams"]');
        expect(teams?.getAttribute('data-frame-card-context')).toBe('overview');
        expect(teams?.querySelector('[data-frame-card="figure-card"]')).toBeTruthy();

        // The one output the cards path must never show for a bound row.
        expect(container.innerHTML).not.toContain('{"resource"');
    });

    it('a nav row draws a NavTile with the stamped href and this host’s icon', async () => {
        const { container } = mountLeaf(ROWS);

        await waitFor(() => expect(cells(container)).toHaveLength(ROWS.length));

        const tile = container.querySelector<HTMLAnchorElement>('a[data-frame-card="nav-tile"]');
        expect(tile?.getAttribute('href')).toBe('/operator/users');
        expect(tile?.textContent).toContain('Manage users');
        expect(tile?.textContent).toContain('Every account on the platform');
        // `iconFor: frameIcon` reached the tile: a glyph, not the label's initial.
        expect(tile?.querySelector('svg')).toBeTruthy();
        expect(tile?.textContent).not.toMatch(/^M\s*Manage/);
    });

    it('a row naming a resource this host does not mount renders nothing and throws nothing', async () => {
        const ghost: DashboardRow = { ...ROWS[0], resource: 'ghost', label: 'Ghost', summary: { ...ROWS[0].summary!, key: 'ghost', label: 'Ghost' } };
        const { container } = mountLeaf([...ROWS, ghost]);

        // Four cells mounted (the shell drew a cell per row) …
        await waitFor(() => expect(cells(container)).toHaveLength(ROWS.length + 1));
        // … but the ghost's cell is empty, and the other three are intact.
        expect(container.querySelectorAll('[data-frame-card="dashboard-card"]')).toHaveLength(2);
        expect(container.querySelector('[data-frame-card-resource="ghost"]')).toBeNull();
        expect(screen.queryByText('Ghost')).toBeNull();
        expect(screen.getByText('42')).toBeTruthy();
        expect(container.querySelector('a[data-frame-card="nav-tile"]')).toBeTruthy();
    });
});
