/**
 * `@splicewire/beam-ux/state` (app-walkthrough M12): the six page states, one mapping from the transport, and the
 * `QueryClient` retry default. Client-only; it adds no wire shape.
 */
export { PAGE_STATE_TABLE, type PageState, type PageStateOutcome, type Transport } from './page-state.table.js';
export { messageOf, pageStateOf, retryUnlessClientError, statusOf, transportOf, type QueryLike } from './page-state.js';
export { StateBoundary } from './StateBoundary.js';
