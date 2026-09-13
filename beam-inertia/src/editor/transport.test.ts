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
    expect(await bodyClient.publish?.('e1')).toBe(state);
    expect(load).toHaveBeenCalledWith('e1');
    expect(bodyClient.saveDraft).toBeUndefined();

    configureBeamInertia({});
    expect(bodyClient.publish).toBeTypeOf('function');
    expect(bodyClient.saveDraft).toBeTypeOf('function');
    expect(bodyClient.listVersions).toBeTypeOf('function');
    expect(bodyClient.restoreVersion).toBeTypeOf('function');
});
