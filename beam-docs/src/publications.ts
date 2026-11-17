import { xsrfHeader } from '@schemastud/frame/session';
import { createFormValidator } from '@schemastud/seam';
import type { RJSFSchema } from '@rjsf/utils';
import publicationSchema from './generated/publication.schema.json';
import type { PublicationData, PublishInputData } from './generated/types.js';
import { notice, say, type Notice } from './message-descriptor.js';
import { englishBeamDocsMessages, type BeamDocsMessageKey } from './messages.js';

export type { PublicationData, PublicationStatus, PublishInputData } from './generated/types.js';

/** Return decoded JSON, retaining the server's `{ data: ... }` envelope. */
export type DocsTransport = (url: string, init?: RequestInit) => Promise<unknown>;

/**
 * One of this package's fixed request failures: it carries the catalog line (`notice`) the panel renders in the
 * reader's locale; `message` stays the English line for logs and for a host that reads it (localization 30).
 */
export class DocsRequestError extends Error {
    constructor(readonly notice: Notice) {
        super(say(englishBeamDocsMessages, notice));
    }
}

const failed = (key: BeamDocsMessageKey) => new DocsRequestError(notice(key));

function requestMessage(status: number): BeamDocsMessageKey {
    if (status === 401 || status === 403) return 'splicewire-beam-docs::messages.request_forbidden';
    if (status === 419) return 'splicewire-beam-docs::messages.request_session_expired';
    if (status === 422) return 'splicewire-beam-docs::messages.request_invalid';
    if (status === 409) return 'splicewire-beam-docs::messages.request_conflict';
    if (status === 404) return 'splicewire-beam-docs::messages.request_unavailable';
    return 'splicewire-beam-docs::messages.request_failed';
}

/** Cookie-authenticated, same-origin Laravel transport; never renders an HTTP error body. */
export const fetchDocs: DocsTransport = async (url, init = {}) => {
    const target = new URL(url, window.location.href);
    if (target.origin !== window.location.origin) {
        throw failed('splicewire-beam-docs::messages.request_origin');
    }

    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');

    if ((init.method ?? 'GET').toUpperCase() !== 'GET') {
        let token: Record<string, string>;
        try {
            token = xsrfHeader();
        } catch {
            throw failed('splicewire-beam-docs::messages.request_token');
        }
        const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (Object.keys(token).length > 0) {
            for (const [name, value] of Object.entries(token)) headers.set(name, value);
        } else if (meta) {
            headers.set('X-CSRF-TOKEN', meta);
        }
    }

    const response = await fetch(target.href, {
        ...init, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) throw failed(requestMessage(response.status));
    return response.json();
};

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

let validator: ReturnType<typeof createFormValidator> | undefined;
// JSON imports widen keyword strings; the producer emits a JSON Schema, validated by AJV here.
const schema: RJSFSchema = publicationSchema as RJSFSchema;

function publication(value: unknown): PublicationData {
    validator ??= createFormValidator();
    if (!validator.isValid(schema, value, schema)) {
        throw failed('splicewire-beam-docs::messages.response_status');
    }
    return value as PublicationData;
}

function data(value: unknown): unknown {
    if (!record(value) || !('data' in value)) {
        throw failed('splicewire-beam-docs::messages.response_unreadable');
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
            if (!Array.isArray(result)) throw failed('splicewire-beam-docs::messages.response_list');
            return result.map(publication);
        },
        async get(id: string, signal?: AbortSignal): Promise<PublicationData> {
            return publication(data(await transport(`${base}/${encodeURIComponent(id)}`, { signal })));
        },
        async publish(version: PublishInputData['version'], signal?: AbortSignal): Promise<PublicationData> {
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

/**
 * HTTP bodies and arbitrary transport exceptions may contain secrets; only our fixed messages pass. Returned as a notice
 * (a catalog key), so the panel keeps the key and renders it in the reader's current locale.
 */
export function publicationRequestMessage(error: unknown): Notice {
    return error instanceof DocsRequestError ? error.notice : notice('splicewire-beam-docs::messages.request_unreachable');
}
