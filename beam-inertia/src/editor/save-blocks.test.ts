import { afterEach, expect, it, vi } from 'vitest';
import { configureBeamInertia } from '../config';
import { bodyClient } from './transport';
const envelope = { id: 'entry', slug: 'home', type: 'page', format: 'tsx', schema: null, body: {}, source: null, compileError: null, authoredComponents: [] };
const body = [{ kind: 'text' as const, value: 'Typed canvas' }];
afterEach(() => { configureBeamInertia({}); vi.unstubAllGlobals(); });
function setup(...responses: Response[]) {
    const fetch = vi.fn();
    for (const response of responses) fetch.mockResolvedValueOnce(response);
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' });
    return fetch;
}
it('uses save-blocks for canvas writes and preserves the stateful envelope', async () => {
    const fetch = setup(Response.json({ data: envelope }));
    expect(await bodyClient.saveBlocks!('entry', body)).toEqual(envelope);
    expect(fetch.mock.calls[0][0]).toBe('/beam-ux-entries/entry/save-blocks');
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin', headers: { 'X-XSRF-TOKEN': 'token' }, body: JSON.stringify({ body }) });
});
it.each([404, 405])('falls back only for an older host lacking the operation (%s)', async status => {
    const fetch = setup(Response.json({ message: 'Missing operation' }, { status }), Response.json({ data: envelope }));
    await bodyClient.saveBlocks!('entry', body);
    expect(fetch.mock.calls.map(call => call[0])).toEqual(['/beam-ux-entries/entry/save-blocks', '/beam-ux-entries/entry/save-body']);
});
it.each([401, 403, 409, 422, 500])('never retries a refused/failed typed write through the legacy route (%s)', async status => {
    const fetch = setup(Response.json({ message: 'Refused' }, { status }));
    await expect(bodyClient.saveBlocks!('entry', body)).rejects.toMatchObject({ status });
    expect(fetch).toHaveBeenCalledTimes(1);
});
it('keeps an injected legacy-only host client free of default HTTP', async () => {
    const fetch = setup();
    const saveBody = vi.fn().mockResolvedValue(envelope);
    configureBeamInertia({ entryClient: { loadBody: async () => envelope, saveBody } });
    expect(bodyClient.saveBlocks).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
});
