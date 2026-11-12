import type { SessionRequest } from '@schemastud/frame/session';
import type {
    PlatformConnection,
    PlatformConnectionEndpoints,
    PlatformConnectionHealth,
} from './types';

/**
 * The transport seam for the platform-connection panel.
 *
 * A named port rather than a `fetch` call inline, for the reason the tokens surface already
 * established: a host with its own client runtime (interceptors, an operator tier, an axios
 * instance) substitutes it, and the panel's tests drive it without a network.
 *
 * The default client sends through the request it is handed (ticket 48: `(request, endpoints)`); the panel hands it
 * `createSessionRequest()` from `@schemastud/frame/session`.
 */
export type PlatformConnectionClient = {
    connect(label: string | null): Promise<PlatformConnection>;
    poll(): Promise<PlatformConnection>;
    check(): Promise<PlatformConnectionHealth>;
    disconnect(): Promise<PlatformConnection>;
};

/**
 * `ParticleOperationController` answers a declared `output:` inside the beam envelope — `{ data: … }`
 * — so the payload is one unwrap down. Written as a guard rather than a cast because an un-enveloped
 * body is exactly what a misrouted POST (an HTML error page, a redirect to login) produces, and a
 * blind `body.data` would hand `undefined` to the renderer as though it were a state.
 */
function unwrap<T>(body: unknown, url: string): T {
    if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
        return (body as { data: T }).data;
    }

    throw new Error(`${url} answered a body with no data envelope.`);
}

export function createPlatformConnectionClient(
    request: SessionRequest,
    endpoints: PlatformConnectionEndpoints,
): PlatformConnectionClient {
    // A refusal rejects with frame's FrameActionError, whose message is the server's own (a 422's validation message, a
    // 403's entitlement refusal) ahead of the status, which is what the operator needs to read. An empty body still
    // posts `{}`, as the operations' declared input expects.
    async function post<T>(url: string, body?: unknown): Promise<T> {
        return unwrap<T>((await request('POST', url, undefined, body ?? {})).data, url);
    }

    return {
        connect: (label) => post<PlatformConnection>(endpoints.connect, { label }),
        poll: () => post<PlatformConnection>(endpoints.poll),
        check: () => post<PlatformConnectionHealth>(endpoints.check),
        disconnect: () => post<PlatformConnection>(endpoints.disconnect),
    };
}
