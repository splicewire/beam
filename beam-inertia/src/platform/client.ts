import { jsonHeaders } from '../frame/xsrf';
import type {
    PlatformCapabilityRead,
    PlatformConnection,
    PlatformConnectionEndpoints,
} from './types';

/**
 * The transport seam for the platform-connection panel.
 *
 * A named port rather than a `fetch` call inline, for the reason the tokens surface already
 * established: a host with its own client runtime (interceptors, an operator tier, an axios
 * instance) substitutes it, and the panel's tests drive it without a network.
 */
export type PlatformConnectionClient = {
    connect(label: string | null): Promise<PlatformConnection>;
    poll(): Promise<PlatformConnection>;
    invokeCapability(surface: string): Promise<PlatformCapabilityRead>;
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
    endpoints: PlatformConnectionEndpoints,
): PlatformConnectionClient {
    async function post<T>(url: string, body?: unknown): Promise<T> {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: jsonHeaders(),
            body: body === undefined ? '{}' : JSON.stringify(body),
        });

        if (!response.ok) {
            // The server's own refusal beats a status code every time: a 422 here carries the
            // validation message and a 403 carries the entitlement refusal, and both are what the
            // operator needs to read. The status is kept as the fallback for a body that has none.
            let message = `The request failed (${response.status}).`;

            try {
                const payload = (await response.json()) as { message?: string };
                if (typeof payload?.message === 'string' && payload.message !== '') {
                    message = payload.message;
                }
            } catch {
                // A non-JSON error body (an HTML error page) leaves the status-code fallback standing.
            }

            throw new Error(message);
        }

        return unwrap<T>(await response.json(), url);
    }

    return {
        connect: (label) => post<PlatformConnection>(endpoints.connect, { label }),
        poll: () => post<PlatformConnection>(endpoints.poll),
        invokeCapability: (surface) =>
            post<PlatformCapabilityRead>(endpoints.invokeCapability, { surface }),
        disconnect: () => post<PlatformConnection>(endpoints.disconnect),
    };
}
