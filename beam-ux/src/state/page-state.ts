import type { PageStateOutcome, Transport } from './page-state.table.js';

/**
 * The ONE mapping from a read's transport outcome to a page state (app-walkthrough APP-8, M12). Tested row by row
 * against {@see PAGE_STATE_TABLE}.
 */
export function pageStateOf(transport: Transport): PageStateOutcome {
    if (transport.phase === 'in-flight') return { state: 'loading', retry: null };
    if (transport.phase === 'network-error') return { state: 'error', retry: 'bounded' };

    const { status } = transport;
    if (status >= 200 && status < 300) {
        if (transport.rows === undefined) return { state: 'ready', retry: null };
        return transport.rows > 0
            ? { state: 'ready', retry: null }
            : { state: 'empty', retry: null, filtered: transport.filtered === true };
    }
    if (status === 401 || status === 403) return { state: 'forbidden', retry: 'never' };
    if (status === 402) return { state: 'upsell', retry: 'never' };
    if (status === 404) return { state: 'not-found', retry: 'never' };
    if (status >= 400 && status < 500) return { state: 'error', retry: 'never' };

    return { state: 'error', retry: 'bounded' };
}

/** The HTTP status a failed read carries, axios-shaped (`error.response.status`) or fetch-shaped (`error.status`). */
export function statusOf(error: unknown): number | null {
    if (error === null || typeof error !== 'object') return null;
    const e = error as { status?: unknown; response?: { status?: unknown } };
    const status = typeof e.response?.status === 'number' ? e.response.status : e.status;

    return typeof status === 'number' ? status : null;
}

/** The server's own message on a failed read, if it sent one. */
export function messageOf(error: unknown): string | null {
    if (error === null || typeof error !== 'object') return null;
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;

    return typeof message === 'string' && message !== '' ? message : null;
}

/** The part of a TanStack-style query result the transport reading needs. */
export type QueryLike = { status: 'pending' | 'error' | 'success'; error: unknown; data: unknown };

/** A query, read as the transport saw it. A list is counted (a bare array or a `{ data: [] }` envelope). */
export function transportOf(query: QueryLike, options: { filtered?: boolean } = {}): Transport {
    if (query.status === 'pending') return { phase: 'in-flight' };
    if (query.status === 'error') {
        const status = statusOf(query.error);
        return status === null ? { phase: 'network-error' } : { phase: 'answered', status };
    }

    const list = Array.isArray(query.data)
        ? query.data
        : Array.isArray((query.data as { data?: unknown } | null)?.data)
          ? ((query.data as { data: unknown[] }).data)
          : null;

    if (list === null) return { phase: 'answered', status: 200 };

    return options.filtered === undefined
        ? { phase: 'answered', status: 200, rows: list.length }
        : { phase: 'answered', status: 200, rows: list.length, filtered: options.filtered };
}

/**
 * The `QueryClient` default `retry` (APP-8): never retry a 4xx; retry a 5xx or a network failure once. Lifted from the
 * flagship's dispatched A3 `retryQuery`, its first adapter.
 */
export function retryUnlessClientError(failureCount: number, error: unknown): boolean {
    const status = statusOf(error);
    if (status !== null && status >= 400 && status < 500) return false;

    return failureCount < 1;
}
