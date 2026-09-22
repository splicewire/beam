// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { frameTransport } from './transport';

afterEach(() => vi.unstubAllGlobals());

it('preserves a declared creation result and keeps row updates separate', async () => {
    const created = { hook: { id: 'hook-1' }, secret: 'one-time-secret', pinged: false };
    const fetch = vi.fn(async (_input: string, init: RequestInit) =>
        Response.json({ data: init.method === 'POST' ? created : { id: 'hook-1', paused: true } }),
    );
    vi.stubGlobal('fetch', fetch);

    expect(await frameTransport.create<typeof created>('hooks', { endpoint: '/receiver' })).toEqual(created);
    expect(fetch).toHaveBeenNthCalledWith(1, '/frame/resources/hooks', expect.objectContaining({
        method: 'POST', credentials: 'same-origin', body: JSON.stringify({ endpoint: '/receiver' }),
    }));
    expect(await frameTransport.save('hooks', 'hook-1', { paused: true })).toEqual({ id: 'hook-1', paused: true });
    expect(fetch).toHaveBeenNthCalledWith(2, '/frame/resources/hooks/records/hook-1', expect.objectContaining({
        method: 'PUT', body: JSON.stringify({ paused: true }),
    }));
});

it('uses resource-scoped filter HTTP and all saved-view CRUD pages with session credentials', async () => {
    let stored = Array.from({ length: 29 }, (_, index) => ({
        id: String(index),
        name: `View ${index}`,
        resource: 'articles',
        query_parameters: {},
        visibility: 'private',
        is_default: false,
    }));
    const requests: Array<{ url: URL; init: RequestInit }> = [];
    const fetch = vi.fn(async (input: string, init: RequestInit) => {
        const url = new URL(input, 'https://host.test');
        requests.push({ url, init });
        if (url.pathname === '/frame/resources/articles/filters/schema') {
            return Response.json({
                data: { properties: {} },
                savedViewsResource: 'personal-views',
            });
        }
        if (url.pathname === '/frame/resources/articles/filters/options/authors') {
            expect(url.searchParams.get('search')).toBe('Ada & Lin');
            return Response.json({ data: [{ value: 'ada', label: 'Ada' }] });
        }
        if (url.pathname === '/frame/resources/personal-views') {
            if (init.method === 'POST') {
                const saved = {
                    id: 'new',
                    visibility: 'private',
                    is_default: false,
                    ...JSON.parse(String(init.body)),
                };
                stored.push(saved);
                return Response.json({ data: saved });
            }
            expect(url.searchParams.get('filter[resource]')).toBe('articles');
            const page = Number(url.searchParams.get('page'));
            return Response.json({
                data: stored.slice((page - 1) * 25, page * 25),
                page,
                perPage: 25,
                total: stored.length,
            });
        }
        if (
            url.pathname === '/frame/resources/personal-views/records/new' &&
            init.method === 'DELETE'
        ) {
            stored = stored.filter((view) => view.id !== 'new');
            return new Response(null, { status: 204 });
        }
        throw new Error(`Unexpected request: ${init.method} ${url}`);
    });
    vi.stubGlobal('fetch', fetch);
    expect(await frameTransport.getFilterOptions('articles', 'authors', 'Ada & Lin')).toEqual([
        { value: 'ada', label: 'Ada' },
    ]);
    expect(await frameTransport.getSavedFilters('articles')).toHaveLength(29);
    const payload = {
        name: 'New view',
        query_parameters: { sort: '-created_at' },
    };
    expect(await frameTransport.saveFilter('articles', payload)).toMatchObject({
        id: 'new',
        resource: 'articles',
        ...payload,
    });
    expect(await frameTransport.getSavedFilters('articles')).toHaveLength(30);
    await frameTransport.deleteSavedFilter('articles', 'new');
    expect(await frameTransport.getSavedFilters('articles')).toHaveLength(29);
    expect(requests.every(({ init }) => init.credentials === 'same-origin')).toBe(true);
});

it('does not invent saved-view persistence for a resource without support', async () => {
    const fetch = vi.fn(async (_input: string) =>
        Response.json({ data: { properties: {} }, savedViewsResource: null }),
    );
    vi.stubGlobal('fetch', fetch);
    expect(await frameTransport.getSavedFilters('unsupported')).toEqual([]);
    await expect(
        frameTransport.saveFilter('unsupported', {
            name: 'Fake',
            query_parameters: {},
        }),
    ).rejects.toThrow('unavailable');
    expect(fetch.mock.calls.every((call) => String(call[0]).endsWith('/filters/schema'))).toBe(
        true,
    );
});
