// @vitest-environment jsdom
import { router } from '@inertiajs/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createWidgetRegistry, FrameProvider, KNOWN_CONTEXTS } from '@schemastud/frame';
import type { FrameInjection, RouteContextEntry } from '@schemastud/frame';
import type { AnchorHTMLAttributes } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FrameConsole from '../pages/frame/console';
import type { FrameManifest } from './manifest';
import { framePrimitives } from './primitives';
import { FrameRealmProvider } from './realm';
import { FrameRoutes } from './router';
import { frameTransport } from './transport';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => ({ props: {} }),
    Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
    router: {
        visit: vi.fn((href: string) => {
            window.history.pushState({}, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
        }),
    },
}));

const leaf = (
    routeName: string,
    path: string,
    mounts: RouteContextEntry['mounts'],
    shell = 'app'
): RouteContextEntry => ({
    routeName,
    path,
    mounts,
    shell,
    guard: null,
    lazy: false,
    resource: 'documents',
});

function fixture({ create = true, show = true, editable = false, host = false } = {}) {
    const manifest: FrameManifest = {
        resources: [
            {
                key: 'documents',
                creatable: create,
                editable,
                deletable: false,
                showable: show,
                form: 'bare',
                nav: { label: 'Documents', group: null, icon: null },
            },
        ],
        contexts: {
            documents: {
                byNode: { name: { 'list-column': { participates: true, label: 'Name' } } },
                inherits: {},
                known: KNOWN_CONTEXTS,
                singularLabel: 'document',
                createAffordance: create && !host ? 'frame' : 'host',
                can: { create, update: editable, delete: false },
            },
        },
        nav: { items: [] },
        routeContext: [
            leaf('documents.index', 'catalog', 'list'),
            ...(create && !host ? [leaf('documents.create', 'catalog/new', 'edit')] : []),
            ...(show || editable
                ? [leaf('documents.edit', 'catalog/:id', editable ? 'edit' : 'detail')]
                : []),
        ],
    };
    const requests: { path: string; method: string; body: unknown }[] = [];
    const fetch: typeof globalThis.fetch = async (input, init) => {
        const url = new URL(
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
            'https://console.example'
        );
        const method = init?.method ?? 'GET';
        const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
        requests.push({ path: url.pathname, method, body });
        if (url.pathname === '/operator/frame/manifest') return Response.json(manifest);
        if (url.pathname.endsWith('/filters/schema'))
            return Response.json({ data: { type: 'object', properties: {} } });
        if (url.pathname.endsWith('/schema'))
            return Response.json({
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', title: 'Name' } },
            });
        if (url.pathname === '/frame/resources/documents') {
            return Response.json(
                method === 'POST'
                    ? { data: { id: 'created', ...body } }
                    : {
                          data: [{ id: 'existing', name: 'Existing document' }],
                          total: 1,
                          page: 1,
                          perPage: 25,
                      }
            );
        }
        if (
            url.pathname === '/frame/resources/documents/records/existing' ||
            url.pathname === '/frame/resources/documents/records/new'
        )
            return Response.json({
                data: { id: url.pathname.split('/').pop(), name: 'Existing document' },
            });
        throw new Error(`Unexpected ${method} ${url.pathname}`);
    };
    return { manifest, requests, fetch };
}
let client: QueryClient;
beforeEach(() => {
    client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
function mount(data = fixture(), path = '/operator/catalog') {
    window.history.replaceState({}, '', path);
    vi.stubGlobal('fetch', data.fetch);
    return render(
        <QueryClientProvider client={client}>
            <FrameConsole
                realm="operator"
                basename="/operator"
                manifestUrl="/operator/frame/manifest"
            />
        </QueryClientProvider>
    );
}

describe('explicit Frame creation destinations', () => {
    it.each([false, true])('New opens and POSTs a null-ID form with show=%s', async (show) => {
        const data = fixture({ show });
        const save = vi.spyOn(frameTransport, 'save');
        mount(data);
        fireEvent.click(await screen.findByRole('button', { name: 'New document' }));
        expect(router.visit).toHaveBeenLastCalledWith('/operator/catalog/new');
        fireEvent.change(await screen.findByRole('textbox', { name: /^Name/ }), {
            target: { value: 'Created document' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(save).toHaveBeenCalledWith('documents', null, { name: 'Created document' })
        );
        expect(data.requests.filter(({ method }) => method === 'POST')).toEqual([
            {
                path: '/frame/resources/documents',
                method: 'POST',
                body: { name: 'Created document' },
            },
        ]);
        expect(data.requests.some(({ path }) => path.includes('/records/'))).toBe(false);
    });

    it('opens immutable records through detail and never offers Save', async () => {
        const data = fixture();
        mount(data);
        fireEvent.click(await screen.findByText('Existing document'));
        expect(router.visit).toHaveBeenLastCalledWith('/operator/catalog/existing');
        await screen.findByDisplayValue('Existing document');
        expect(data.requests.some(({ path }) => path.endsWith('/records/existing'))).toBe(true);
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });

    it('keeps declared editable records on the PUT path', async () => {
        const data = fixture({ editable: true });
        const save = vi.spyOn(frameTransport, 'save');
        mount(data, '/operator/catalog/existing');
        fireEvent.change(await screen.findByDisplayValue('Existing document'), {
            target: { value: 'Updated document' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(save).toHaveBeenCalledWith('documents', 'existing', {
                id: 'existing',
                name: 'Updated document',
            })
        );
        expect(
            data.requests.some(
                ({ method, path }) => method === 'PUT' && path.endsWith('/records/existing')
            )
        ).toBe(true);
    });

    it.each([{ create: false }, { host: true }])(
        'does not invent creation for %j',
        async (options) => {
            mount(fixture(options));
            await screen.findByText('Existing document');
            expect(screen.queryByRole('button', { name: 'New document' })).toBeNull();
            expect(router.visit).not.toHaveBeenCalled();
        }
    );

    it('does not fall back to a record twin when the explicit create leaf is absent', async () => {
        const data = fixture();
        data.manifest.routeContext = data.manifest.routeContext.filter(
            (entry) => entry.routeName !== 'documents.create'
        );
        mount(data);
        fireEvent.click(await screen.findByRole('button', { name: 'New document' }));
        expect(router.visit).not.toHaveBeenCalled();
    });

    it.each(['create', 'record'])(
        'matches the %s destination in the list leaf’s own shell',
        async (destination) => {
            const data = fixture();
            data.manifest.routeContext.unshift(
                leaf('other.create', 'elsewhere/new', 'edit', 'other'),
                leaf('other.edit', 'elsewhere/:id', 'detail', 'other')
            );
            mount(data);
            if (destination === 'create') {
                fireEvent.click(await screen.findByRole('button', { name: 'New document' }));
                expect(router.visit).toHaveBeenLastCalledWith('/operator/catalog/new');
            } else {
                fireEvent.click(await screen.findByText('Existing document'));
                expect(router.visit).toHaveBeenLastCalledWith('/operator/catalog/existing');
            }
        }
    );

    it('treats new as a literal ID on a record-only route', async () => {
        const data = fixture({ create: false });
        mount(data, '/operator/catalog/new');
        await screen.findByDisplayValue('Existing document');
        expect(data.requests.some(({ path }) => path.endsWith('/records/new'))).toBe(true);
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });

    it('mounts the declared heavyweight create widget with no record fetch and saves a null ID', async () => {
        const data = fixture({ show: false });
        data.manifest.routeContext[1] = {
            ...data.manifest.routeContext[1],
            mounts: 'widget',
            widget: 'document-editor',
        };
        vi.stubGlobal('fetch', data.fetch);
        const save = vi.spyOn(frameTransport, 'save');
        const registry = createWidgetRegistry();
        registry.registerWidget(
            'document-editor',
            ({ onSubmit }: { onSubmit?: (data: { name: string }) => void }) => (
                <button onClick={() => onSubmit?.({ name: 'Widget draft' })}>
                    Create widget draft
                </button>
            )
        );
        const injection: FrameInjection = {
            transport: frameTransport,
            primitives: framePrimitives,
            registry,
            can: () => true,
            schemaFetcher: async () => ({}),
            useUrlState: () => [new URLSearchParams(), () => {}] as const,
        };
        render(
            <QueryClientProvider client={client}>
                <FrameProvider value={injection}>
                    <FrameRealmProvider basename="/operator">
                        <MemoryRouter
                            basename="/operator"
                            initialEntries={['/operator/catalog/new']}
                        >
                            <FrameRoutes manifest={data.manifest} />
                        </MemoryRouter>
                    </FrameRealmProvider>
                </FrameProvider>
            </QueryClientProvider>
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Create widget draft' }));
        await waitFor(() =>
            expect(save).toHaveBeenCalledWith('documents', null, { name: 'Widget draft' })
        );
        expect(data.requests.some(({ path }) => path.includes('/records/'))).toBe(false);
    });
});
