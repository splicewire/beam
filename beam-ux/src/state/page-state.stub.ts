import type { PageStateOutcome, Transport } from './page-state.table';

/**
 * A STUB of `pageStateOf` that implements APP-8's table, so the table is executable now (ticket APP-02). APP-05 builds
 * the real module (M12, `@splicewire/beam-ux/state`), points page-state.test.ts at it, and deletes this file. Not
 * exported from the package.
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
