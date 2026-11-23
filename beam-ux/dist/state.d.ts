import * as react from 'react';
import { ReactNode } from 'react';

/**
 * The ONE mapping from a read's transport outcome to a page state (app-walkthrough SPEC rule APP-8, ticket APP-02).
 * Every routed page and every independently loaded card is in exactly one state, exposed as `data-page-state`. A failed
 * read never renders as `empty` or zero, `loading` never outlives its request, and no 4xx is retried.
 *
 * This is DATA: `pageStateOf` (M12, `@splicewire/beam-ux/state`, ticket APP-05) is tested against these rows.
 */
type PageState = 'loading' | 'ready' | 'empty' | 'forbidden' | 'not-found' | 'error' | 'upsell';
/** What the transport knows about one read. `status` is absent while in flight and for a network failure. */
type Transport = {
    phase: 'in-flight';
} | {
    phase: 'network-error';
} | {
    phase: 'answered';
    status: number;
    rows?: number;
    filtered?: boolean;
};
type PageStateOutcome = {
    state: PageState;
    /** `never` for every 4xx; `bounded` (then a "Try again") only for 5xx and network failures. */
    retry: 'never' | 'bounded' | null;
    /** Only an empty result under an active filter may say "No … match these filters". */
    filtered?: boolean;
};
declare const PAGE_STATE_TABLE: ReadonlyArray<{
    name: string;
    transport: Transport;
    outcome: PageStateOutcome;
}>;

/**
 * The ONE mapping from a read's transport outcome to a page state (app-walkthrough APP-8, M12). Tested row by row
 * against {@see PAGE_STATE_TABLE}.
 */
declare function pageStateOf(transport: Transport): PageStateOutcome;
/** The HTTP status a failed read carries, axios-shaped (`error.response.status`) or fetch-shaped (`error.status`). */
declare function statusOf(error: unknown): number | null;
/** The server's own message on a failed read, if it sent one. */
declare function messageOf(error: unknown): string | null;
/** The part of a TanStack-style query result the transport reading needs. */
type QueryLike = {
    status: 'pending' | 'error' | 'success';
    error: unknown;
    data: unknown;
};
/** A query, read as the transport saw it. A list is counted (a bare array or a `{ data: [] }` envelope). */
declare function transportOf(query: QueryLike, options?: {
    filtered?: boolean;
}): Transport;
/**
 * The `QueryClient` default `retry` (APP-8): never retry a 4xx; retry a 5xx or a network failure once. Lifted from the
 * flagship's dispatched A3 `retryQuery`, its first adapter.
 */
declare function retryUnlessClientError(failureCount: number, error: unknown): boolean;

/**
 * An optional escape from a refusal (APP-9 "with a way back"): a labeled link to somewhere the reader can
 * still go. Every refusal/failure state renders it when given — forbidden, not-found, and the error
 * fallback (beside "Try again") — so none is a dead end. A plain anchor: `@splicewire/beam-ux/state` is
 * framework-agnostic, so the host router owns navigation; `target` is an in-app path or a URL.
 */
type WayBack = {
    label: string;
    target: string;
    /** Render the link through the host's router (e.g. react-router's `<Link>`) so the way back navigates
     *  without a full page reload. Receives the resolved `target`/`className`/`children`; when omitted it is a
     *  plain `<a href={target}>` (beam-ux stays framework-agnostic). */
    render?: (props: {
        target: string;
        className: string;
        children: ReactNode;
    }) => ReactNode;
};
/**
 * The shared forbidden page state (APP-8), as a standalone node that owns its `data-page-state="forbidden"`
 * marker. Exported so a KNOWN refusal with no query behind it — a manifest leaf the actor isn't admitted to —
 * renders the refusal directly instead of faking a 403 query. `StateBoundary` renders it for a 401/403 read.
 */
declare function ForbiddenState({ label, wayBack }: {
    label: string;
    wayBack?: WayBack;
}): react.JSX.Element;
type Props = {
    /** The read this region renders. */
    query: QueryLike;
    /** The object, as the page names it ("agents", "this calendar"), so a refusal says what was refused. */
    label: string;
    /** An empty result under an active filter may say "No … match these filters". */
    filtered?: boolean;
    /** Offered as "Try again" only after a 5xx or a network failure (APP-8: no 4xx is retried). */
    onRetry?: () => void;
    /** What the region shows for a 402 gate denial (an upsell). */
    upsell?: ReactNode;
    /** An optional way back offered by every refusal/failure state (forbidden, not-found, error) — no dead end. */
    wayBack?: WayBack;
    children: ReactNode;
};
/**
 * M12's region boundary (app-walkthrough APP-8, APP-9): the region is in exactly one page state, exposed as
 * `data-page-state`, derived only by {@see pageStateOf}. The children render only when the read answered (`ready` or
 * `empty`; the page draws its own empty line). A refusal names the object and offers no "Try again"; where the page
 * supplies a `wayBack`, every refusal/failure state offers it so the reader is never stranded (APP-9).
 */
declare function StateBoundary({ query, label, filtered, onRetry, upsell, wayBack, children }: Props): react.JSX.Element;

export { ForbiddenState, PAGE_STATE_TABLE, type PageState, type PageStateOutcome, type QueryLike, StateBoundary, type Transport, type WayBack, messageOf, pageStateOf, retryUnlessClientError, statusOf, transportOf };
