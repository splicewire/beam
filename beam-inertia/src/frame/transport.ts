import type { FrameTransport, ResourcePage, Row } from '@schemastud/frame';
import { createResourceTransport, FrameActionError, parseResourcePage } from '@schemastud/frame';
import type { SchemaNode } from '@schemastud/seam';
import { jsonHeaders } from './xsrf';

// ⚠️ These URLs are LITERALS and the mount they point at is CONFIG-DRIVEN (`config/frame.php` →
// route_prefix, `/frame` here — `php artisan route:list | grep frame`). Wayfinder is retired
// fleet-wide (beam-runbook ADR-0004), so nothing links these strings to that config: move the prefix
// and every call here 404s silently. If the frame console shows empty tables, diff these paths
// against `route:list` BEFORE looking anywhere else.
const FRAME = '/frame';

async function fetchJson<T = unknown>(url: string): Promise<T> {
    const res = await fetch(url, {
        method: 'GET',
        headers: jsonHeaders(),
        credentials: 'same-origin',
    });

    if (!res.ok) {
        throw new Error(`GET ${url} failed (${res.status})`);
    }

    return (await res.json()) as T;
}

async function writeJson<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: jsonHeaders(),
        credentials: 'same-origin',
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!res.ok) {
        throw new Error(`${method} ${url} failed (${res.status})`);
    }

    return (await res.json().catch(() => null)) as T;
}

/**
 * A declared ACTION's request (schemastud/laravel-frame ADR-0005) — sent to the action's OWN URL, which is
 * the producer's mount (a beam `#[ParticleOp]` route), not the Frame socket. A non-2xx answer rejects with
 * a {@link FrameActionError} carrying the parsed body, so the action UI can put a 422's field errors on the
 * form and show any other refusal's `message` (a 402 decline, a 403).
 */
async function sendAction<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: jsonHeaders(),
        credentials: 'same-origin',
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const parsed = await res.json().catch(() => null);

    if (!res.ok) {
        throw new FrameActionError(res.status, parsed, `${method} ${url} failed (${res.status}).`);
    }

    return parsed as T;
}

/**
 * The {@link FrameTransport} over this host's Frame socket — the read/write envelopes
 * `Schemastud\Frame\Http\Controllers\FrameResourceController` emits: list → `{data,total,page,perPage}`,
 * show → `{data}`, schema → raw JSON Schema, delete → 204.
 */
export const frameTransport: FrameTransport = createResourceTransport(
    {
        async list<Result>(
            resource: string,
            params: Record<string, string>,
        ): Promise<ResourcePage<Result>> {
            const query = new URLSearchParams(params).toString();
            const listUrl = `${FRAME}/resources/${resource}`;
            const body = await fetchJson<ResourcePage<Result>>(
                query ? `${listUrl}?${query}` : listUrl,
            );
            return parseResourcePage(body);
        },
        async get(resource, id): Promise<Row> {
            const body = await fetchJson<{ data: Row }>(
                `${FRAME}/resources/${resource}/records/${id}`,
            );

            return body.data;
        },
        async getFormSchema(resource): Promise<SchemaNode> {
            return fetchJson<SchemaNode>(`${FRAME}/resources/${resource}/schema`);
        },
        async create<Result>(resource: string, data: unknown): Promise<Result> {
            const body = await writeJson<{ data: Result }>(
                'POST',
                `${FRAME}/resources/${resource}`,
                data,
            );
            return body.data;
        },
        async save(resource, id, data): Promise<Row> {
            const body = await writeJson<{ data: Row }>(
                'PUT',
                `${FRAME}/resources/${resource}/records/${id}`,
                data,
            );
            return body.data;
        },
        async remove(resource, id): Promise<void> {
            await writeJson('DELETE', `${FRAME}/resources/${resource}/records/${id}`);
        },
    },
    {
        resourceUrl: (resource) => `${FRAME}/resources/${encodeURIComponent(resource)}`,
        read: (url, params) => {
            const query = new URLSearchParams(params).toString();
            return fetchJson(query ? `${url}?${query}` : url);
        },
        write: sendAction,
    },
);
