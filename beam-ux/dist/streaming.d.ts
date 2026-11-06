/** The minimal shape this hook needs from an injected HTTP client (axios-compatible, duck-typed — no axios dependency). */
interface SseStreamClient {
    defaults: {
        baseURL?: string;
        headers?: {
            common?: Record<string, unknown>;
        };
    };
}
interface UseSseStreamOptions {
    /** HTTP method the stream is opened with (POST for an action that kicks off a run). */
    method?: string;
}
type SseStreamStatus = 'idle' | 'streaming' | 'done' | 'error';
interface UseSseStreamResult<TEvent> {
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
declare function useSseStream<TEvent extends {
    event: string;
    data: unknown;
}>(client: SseStreamClient, path: string, options?: UseSseStreamOptions): UseSseStreamResult<TEvent>;

export { type SseStreamClient, type SseStreamStatus, type UseSseStreamOptions, type UseSseStreamResult, useSseStream };
