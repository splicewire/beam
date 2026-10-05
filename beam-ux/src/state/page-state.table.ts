/**
 * The ONE mapping from a read's transport outcome to a page state (app-walkthrough SPEC rule APP-8, ticket APP-02).
 * Every routed page and every independently loaded card is in exactly one state, exposed as `data-page-state`. A failed
 * read never renders as `empty` or zero, `loading` never outlives its request, and no 4xx is retried.
 *
 * This is DATA: `pageStateOf` (M12, `@splicewire/beam-ux/state`, ticket APP-05) is tested against these rows.
 */
export type PageState = 'loading' | 'ready' | 'empty' | 'forbidden' | 'not-found' | 'error' | 'upsell';

/** What the transport knows about one read. `status` is absent while in flight and for a network failure. */
export type Transport =
    | { phase: 'in-flight' }
    | { phase: 'network-error' }
    | { phase: 'answered'; status: number; rows?: number; filtered?: boolean };

export type PageStateOutcome = {
    state: PageState;
    /** `never` for every 4xx; `bounded` (then a "Try again") only for 5xx and network failures. */
    retry: 'never' | 'bounded' | null;
    /** Only an empty result under an active filter may say "No … match these filters". */
    filtered?: boolean;
};

export const PAGE_STATE_TABLE: ReadonlyArray<{ name: string; transport: Transport; outcome: PageStateOutcome }> = [
    { name: 'in flight', transport: { phase: 'in-flight' }, outcome: { state: 'loading', retry: null } },
    { name: '2xx with rows', transport: { phase: 'answered', status: 200, rows: 3 }, outcome: { state: 'ready', retry: null } },
    { name: '2xx, zero rows, no filter', transport: { phase: 'answered', status: 200, rows: 0 }, outcome: { state: 'empty', retry: null, filtered: false } },
    { name: '2xx, zero rows, filter set', transport: { phase: 'answered', status: 200, rows: 0, filtered: true }, outcome: { state: 'empty', retry: null, filtered: true } },
    { name: '2xx, not a list', transport: { phase: 'answered', status: 200 }, outcome: { state: 'ready', retry: null } },
    { name: '401', transport: { phase: 'answered', status: 401 }, outcome: { state: 'forbidden', retry: 'never' } },
    { name: '403', transport: { phase: 'answered', status: 403 }, outcome: { state: 'forbidden', retry: 'never' } },
    { name: '402 (gate denial)', transport: { phase: 'answered', status: 402 }, outcome: { state: 'upsell', retry: 'never' } },
    { name: '404', transport: { phase: 'answered', status: 404 }, outcome: { state: 'not-found', retry: 'never' } },
    { name: '422', transport: { phase: 'answered', status: 422 }, outcome: { state: 'error', retry: 'never' } },
    { name: 'other 4xx (409)', transport: { phase: 'answered', status: 409 }, outcome: { state: 'error', retry: 'never' } },
    { name: '5xx', transport: { phase: 'answered', status: 503 }, outcome: { state: 'error', retry: 'bounded' } },
    { name: 'network failure', transport: { phase: 'network-error' }, outcome: { state: 'error', retry: 'bounded' } },
];
