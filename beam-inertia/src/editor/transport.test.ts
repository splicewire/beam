import { afterEach, expect, it, vi } from 'vitest';
import type { UxBuilderClient } from '@splicewire/beam-ux';
import { configureBeamInertia } from '../config';
import { bodyClient } from './transport';

const envelope = {
    id: 'e1',
    slug: 'home',
    type: 'page',
    format: 'tsx',
    schema: null,
    body: {},
    source: null,
    compileError: null,
};
const client: UxBuilderClient = {
    loadBody: async () => envelope,
    saveBody: async () => envelope,
};
afterEach(() => {
    configureBeamInertia({});
    vi.unstubAllGlobals();
});

it('loads and saves the default body through canonical ID routes with stateful request envelopes', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: envelope }));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=csrf%20token' });
    configureBeamInertia({});

    expect(await bodyClient.loadBody('entry-uuid')).toEqual(envelope);
    expect(fetch).toHaveBeenNthCalledWith(1, '/beam-ux-entries/entry-uuid/body', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });

    fetch.mockResolvedValueOnce(Response.json({ data: envelope }));
    const body = { content: 'Retain this draft' };
    expect(await bodyClient.saveBody('entry-uuid', body)).toEqual(envelope);
    expect(fetch).toHaveBeenNthCalledWith(2, '/beam-ux-entries/entry-uuid/save-body', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': 'csrf token',
            Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ body }),
    });
});

it('preserves publication absence on an injected body-only client without using default HTTP', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    configureBeamInertia({ entryClient: client });

    expect(await bodyClient.loadBody('e1')).toBe(envelope);
    expect(bodyClient.saveDraft).toBeUndefined();
    expect(bodyClient.publish).toBeUndefined();
    expect(bodyClient.listVersions).toBeUndefined();
    expect(bodyClient.restoreVersion).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
});

it('retains a supplied method receiver and switches back to starter defaults only without a custom client', async () => {
    const state = {
        id: 'e1',
        draftPending: false,
        publishedVersion: null,
        publishedReadable: null,
        headVersion: null,
        headReadable: null,
        versions: [],
        compileError: null,
    };
    const supplied: UxBuilderClient = {
        ...client,
        async publish(id) {
            await this.loadBody(id);
            return state;
        },
    };
    const load = vi.spyOn(supplied, 'loadBody');
    configureBeamInertia({ entryClient: supplied });
    expect(await bodyClient.publish?.('e1', 'v1')).toBe(state);
    expect(load).toHaveBeenCalledWith('e1');
    expect(bodyClient.saveDraft).toBeUndefined();

    configureBeamInertia({});
    expect(bodyClient.publish).toBeTypeOf('function');
    expect(bodyClient.saveDraft).toBeTypeOf('function');
    expect(bodyClient.listVersions).toBeTypeOf('function');
    expect(bodyClient.restoreVersion).toBeTypeOf('function');
});

it('clears through the canonical clear-body route, and an injected client without it offers none', async () => {
    const state = {
        id: 'e1',
        draftPending: false,
        publishedVersion: null,
        publishedReadable: null,
        headVersion: null,
        headReadable: null,
        versions: [],
        compileError: null,
    };
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: state }));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=csrf%20token' });
    configureBeamInertia({});

    expect(await bodyClient.clearBody?.('entry-uuid')).toEqual(state);
    expect(fetch).toHaveBeenCalledWith('/beam-ux-entries/entry-uuid/clear-body', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': 'csrf token',
            Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({}),
    });

    configureBeamInertia({ entryClient: client });
    expect(bodyClient.clearBody).toBeUndefined();
});


it('sends the draft base and named publish ref, and preserves a stale-base status', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json({ data: { headVersion: 'v2' } }));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('document', { cookie: '' });
    configureBeamInertia({});
    await bodyClient.saveDraft?.('e1', { content: 'ours' }, 'v1');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ body: { content: 'ours' }, baseVersion: 'v1' });
    await bodyClient.publish?.('e1', 'v2');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ ref: 'v2' });
    fetch.mockResolvedValueOnce(Response.json({ message: 'Stale base' }, { status: 409 }));
    await expect(bodyClient.saveDraft?.('e1', {}, 'v1')).rejects.toMatchObject({ status: 409 });
});

it('sends page settings with the body in the same versioned draft request', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: { headVersion: 'v2' } }));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('document', { cookie: '' });
    const settings = { title: 'Draft title', segment: 'draft-url' };
    await bodyClient.saveDraft!('e1', { content: 'Body' }, 'v1', undefined, settings);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ body: { content: 'Body' }, baseVersion: 'v1', pageSettings: settings });
});

it('prints and reads source without invoking any save operation',async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(Response.json({data:{source:'<p>Hello</p>'}})).mockResolvedValueOnce(Response.json({data:{body:[]}}));
 vi.stubGlobal('fetch',fetch);vi.stubGlobal('document',{cookie:''});configureBeamInertia({});
 expect(await bodyClient.printSource!('e',[])).toEqual({source:'<p>Hello</p>'});
 expect(await bodyClient.readSource!('e','<p>Hello</p>',[])).toEqual({body:[]});
 expect(fetch.mock.calls.map(call=>call[0])).toEqual(['/beam-ux-entries/e/print-source','/beam-ux-entries/e/read-source']);
 expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({source:'<p>Hello</p>',body:[]});
 configureBeamInertia({entryClient:client});
 expect(bodyClient.printSource).toBeUndefined();expect(bodyClient.readSource).toBeUndefined();
});
