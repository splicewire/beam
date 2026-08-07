/**
 * The shared low-level runtime a generated stream-shaped hook (`TsClientGenerator`,
 * surgeon-audit-viability ticket 28) builds on. Mirrors `ui/src/lib/chat-transport.ts`'s existing
 * fetch+SSE approach (baseURL + Authorization header pulled off the injected client, `readSse()`
 * for frame parsing) generalized into a reusable hook instead of one bespoke transport — the
 * pattern that already worked for chat, not a new invention.
 *
 * Deliberately narrow: this yields a typed stream of `{event, data}` frames and tracks connection
 * lifecycle. It does NOT fold events into app state — that reducer stays the consumer's own
 * concern (chat keeps its `foldEvent`; a simpler consumer like circuits writes its own), per
 * ticket 27's finding that only the low-level parsing generalizes, not the reducer.
 */
import { useCallback, useRef, useState } from 'react';
import { readSse } from '@schemastud/chat/core';

/** The minimal shape this hook needs from an injected HTTP client (axios-compatible, duck-typed — no axios dependency). */
export interface SseStreamClient {
    defaults: {
        baseURL?: string;
        // Duck-typed loosely (not `Record<string, string>`) — axios's real
        // `AxiosInstance['defaults']['headers']['common']` type allows non-string header
        // values (numbers, arrays, undefined), so a strict string-only shape can't accept
        // a real `AxiosInstance` at the call site.
        headers?: { common?: Record<string, unknown> };
    };
}

export interface UseSseStreamOptions {
    /** HTTP method the stream is opened with (POST for an action that kicks off a run). */
    method?: string;
}

export type SseStreamStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface UseSseStreamResult<TEvent> {
    /** Every frame received so far, in arrival order. */
    events: TEvent[];
    status: SseStreamStatus;
    error: unknown;
    /** Open the stream (POSTs `body`, if given) — aborts any stream already in flight first. */
    start: (body?: unknown) => void;
    /** Abort the in-flight stream (if any) and clear accumulated state. */
    reset: () => void;
}

/**
 * A generated `useXStream()` hook wraps this with its own `TEvent` union and route. `TEvent` is
 * expected to be `{ event: string; data: unknown }`-shaped, matching what a generated hook's
 * discriminated union type looks like — frames aren't runtime-validated against it (same
 * trust-the-backend cast every other generated hook already makes).
 */
export function useSseStream<TEvent extends { event: string; data: unknown }>(
    client: SseStreamClient,
    path: string,
    options: UseSseStreamOptions = {},
): UseSseStreamResult<TEvent> {
    const [events, setEvents] = useState<TEvent[]>([]);
    const [status, setStatus] = useState<SseStreamStatus>('idle');
    const [error, setError] = useState<unknown>(null);
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setEvents([]);
        setStatus('idle');
        setError(null);
    }, []);

    const start = useCallback(
        (body?: unknown) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setEvents([]);
            setStatus('streaming');
            setError(null);

            const url = `${client.defaults.baseURL ?? ''}${path}`;
            const authHeader = client.defaults.headers?.common?.['Authorization'];
            const auth = typeof authHeader === 'string' ? authHeader : '';

            void (async () => {
                try {
                    const response = await fetch(url, {
                        method: (options.method ?? 'post').toUpperCase(),
                        headers: {
                            Accept: 'text/event-stream',
                            'Content-Type': 'application/json',
                            Authorization: auth,
                        },
                        body: body !== undefined ? JSON.stringify(body) : undefined,
                        signal: controller.signal,
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    for await (const frame of readSse(response)) {
                        setEvents((prev) => [...prev, frame as unknown as TEvent]);
                    }

                    if (!controller.signal.aborted) {
                        setStatus('done');
                    }
                } catch (err) {
                    if ((err as { name?: string } | undefined)?.name === 'AbortError') {
                        return;
                    }
                    setError(err);
                    setStatus('error');
                }
            })();
        },
        [client, path, options.method],
    );

    return { events, status, error, start, reset };
}
