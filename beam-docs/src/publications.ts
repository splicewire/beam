export type PublicationStatus = 'queued' | 'running' | 'succeeded' | 'failed';

/** The public projection of a persisted docs publication attempt. Credentials never belong here. */
export type PublicationData = {
    id: string;
    version: string;
    status: PublicationStatus;
    sha256: string;
    namespace: string;
    slug: string;
    isPrivate: boolean;
    registryUrl: string | null;
    error: string | null;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    retryOf: string | null;
};

/** Return decoded JSON, retaining the server's `{ data: ... }` envelope. */
export type DocsTransport = (url: string, init?: RequestInit) => Promise<unknown>;

export class DocsRequestError extends Error {}

function requestMessage(status: number): string {
    if (status === 401 || status === 403) return 'You do not have permission to manage documentation publications.';
    if (status === 419) return 'Your session has expired. Reload this page and try again.';
    if (status === 422) return 'Check the release version and publication settings, then try again.';
    if (status === 409) return 'This publication cannot be started again. Refresh its status.';
    if (status === 404) return 'Documentation publishing is unavailable on this site.';
    return 'The publication request failed. Try again or check the publishing service.';
}

/** Cookie-authenticated, same-origin Laravel transport; never renders an HTTP error body. */
export const fetchDocs: DocsTransport = async (url, init = {}) => {
    const target = new URL(url, window.location.href);
    if (target.origin !== window.location.origin) {
        throw new DocsRequestError('Documentation requests must use this site’s origin.');
    }

    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');

    if ((init.method ?? 'GET').toUpperCase() !== 'GET') {
        const cookie = document.cookie.split(';').map((part) => part.trim())
            .find((part) => part.startsWith('XSRF-TOKEN='));
        const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (cookie) {
            try {
                headers.set('X-XSRF-TOKEN', decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)));
            } catch {
                throw new DocsRequestError('Your session token is invalid. Reload this page and try again.');
            }
        } else if (meta) {
            headers.set('X-CSRF-TOKEN', meta);
        }
    }

    const response = await fetch(target.href, {
        ...init, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) throw new DocsRequestError(requestMessage(response.status));
    return response.json();
};

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function publication(value: unknown): PublicationData {
    const strings = ['id', 'version', 'sha256', 'namespace', 'slug', 'createdAt'];
    const nullable = ['registryUrl', 'error', 'startedAt', 'finishedAt', 'retryOf'];
    if (
        !record(value)
        || strings.some((key) => typeof value[key] !== 'string')
        || nullable.some((key) => value[key] !== null && typeof value[key] !== 'string')
        || typeof value.isPrivate !== 'boolean'
        || !['queued', 'running', 'succeeded', 'failed'].includes(String(value.status))
    ) {
        throw new DocsRequestError('The publishing service returned an unreadable status. Refresh and try again.');
    }
    return value as PublicationData;
}

function data(value: unknown): unknown {
    if (!record(value) || !('data' in value)) {
        throw new DocsRequestError('The publishing service returned an unreadable response. Refresh and try again.');
    }
    return value.data;
}

export function createDocsPublicationsClient(
    endpoint = '/beam/docs/publications',
    transport: DocsTransport = fetchDocs,
) {
    const base = endpoint.replace(/\/$/, '');
    return {
        async list(signal?: AbortSignal): Promise<PublicationData[]> {
            const result = data(await transport(base, { signal }));
            if (!Array.isArray(result)) throw new DocsRequestError('The publishing service returned an unreadable list.');
            return result.map(publication);
        },
        async get(id: string, signal?: AbortSignal): Promise<PublicationData> {
            return publication(data(await transport(`${base}/${encodeURIComponent(id)}`, { signal })));
        },
        async publish(version: string, signal?: AbortSignal): Promise<PublicationData> {
            return publication(data(await transport(base, {
                method: 'POST', body: JSON.stringify({ version }), signal,
            })));
        },
        async retry(id: string, signal?: AbortSignal): Promise<PublicationData> {
            return publication(data(await transport(`${base}/${encodeURIComponent(id)}/retry`, {
                method: 'POST', body: JSON.stringify({}), signal,
            })));
        },
    };
}

/** Only a server-selected, successful Scalar Registry destination can become a clickable link. */
export function scalarRegistryUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'registry.scalar.com'
            && url.port === '' && url.username === '' && url.password === '' ? url.href : null;
    } catch {
        return null;
    }
}

export async function fetchRegistryLink(endpoint: string, transport: DocsTransport, signal: AbortSignal): Promise<string | null> {
    const result = data(await transport(endpoint, { signal }));
    return record(result) && typeof result.url === 'string' ? scalarRegistryUrl(result.url) : null;
}

/** HTTP bodies and arbitrary transport exceptions may contain secrets; only our fixed messages pass. */
export function publicationRequestMessage(error: unknown): string {
    return error instanceof DocsRequestError ? error.message
        : 'Could not reach the publishing service. Check your connection and try again.';
}
