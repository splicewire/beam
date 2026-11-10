import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveBeamPage } from '../pages';
import { createSessionRequest } from '@schemastud/frame/session';
import { createPlatformConnectionClient as createClient } from './client';
import type { PlatformConnectionEndpoints } from './types';

/**
 * The transport half of the platform-connection surface.
 *
 * This package's harness has no DOM testing library (see `pages.test.tsx`, which tests resolution
 * rather than rendering), so what is pinned here is the part that can silently do the wrong thing
 * without any visible failure: unwrapping the operation envelope, and turning a refusal into
 * something an operator can read.
 */
const endpoints: PlatformConnectionEndpoints = {
    connect: '/operator/platform-connection/connect',
    poll: '/operator/platform-connection/poll',
    check: '/operator/platform-connection/check',
    disconnect: '/operator/platform-connection/disconnect',
};

/** The client as the panel builds it: over frame's session request. */
const createPlatformConnectionClient = (endpoints: PlatformConnectionEndpoints) => createClient(createSessionRequest(), endpoints);

function stubFetch(response: Response) {
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal('fetch', fetchMock);
    // This package's vitest runs in node with no DOM — deliberately, it has no jsdom dependency and
    // its other suites never needed one. The session request reads the `XSRF-TOKEN` cookie, so the
    // cookie jar is the one browser fact these cases need, and stubbing it is cheaper and more
    // legible than making the whole package carry a DOM environment for four assertions.
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=a-test-token' });

    return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('platform connection client', () => {
    it('unwraps the particle operation envelope rather than handing back the envelope', async () => {
        stubFetch(Response.json({ data: { state: 'pending', userCode: 'WXYZ-1234' } }));

        const connection = await createPlatformConnectionClient(endpoints).connect('ux-demo');

        expect(connection.state).toBe('pending');
        expect(connection.userCode).toBe('WXYZ-1234');
    });

    it('refuses an un-enveloped body instead of rendering undefined as a state', async () => {
        // What a misrouted POST actually produces: a login redirect, an HTML error page, a bare 200
        // from something that is not the operation. A blind `body.data` would make every one of
        // those render as "not connected", which is a security-relevant claim this client does not
        // have the evidence for.
        stubFetch(Response.json({ state: 'paired' }));

        await expect(createPlatformConnectionClient(endpoints).poll()).rejects.toThrow(
            /answered a body with no data envelope/,
        );
    });

    it("surfaces the server's own refusal message ahead of the status code", async () => {
        stubFetch(Response.json({ message: 'This action is unauthorized.' }, { status: 403 }));

        await expect(createPlatformConnectionClient(endpoints).disconnect()).rejects.toThrow(
            'This action is unauthorized.',
        );
    });

    it('falls back to the status when the refusal body carries no message', async () => {
        stubFetch(new Response('<h1>Server Error</h1>', { status: 500 }));

        await expect(createPlatformConnectionClient(endpoints).poll()).rejects.toThrow('(500)');
    });

    it('checks the connection with no surface, and sends the label with the pairing', async () => {
        const fetchMock = vi.fn(async () => Response.json({ data: { ok: true } }));
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=a-test-token' });
        const client = createPlatformConnectionClient(endpoints);

        await client.check();
        await client.connect(null);

        const [checkUrl, checkInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        const [connectUrl, connectInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];

        // ux-walkthrough UX-04: the product check names no surface; the facet listing is `splicewire:connect --check`.
        expect(checkUrl).toBe(endpoints.check);
        expect(JSON.parse(checkInit.body as string)).toEqual({});
        expect(connectUrl).toBe(endpoints.connect);
        // Null, not omitted: the server's declared input treats null as "use this host's own name",
        // which is the same default `splicewire:connect` applies.
        expect(JSON.parse(connectInit.body as string)).toEqual({ label: null });
    });
});

describe('platform connection page', () => {
    it('is resolvable from the package page map, so a host mounts it without publishing a file', async () => {
        await expect(resolveBeamPage('operator/platform-connection')).resolves.toBeTypeOf('function');
    });
});
