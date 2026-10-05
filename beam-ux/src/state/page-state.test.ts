import { describe, expect, it } from 'vitest';
import { PAGE_STATE_TABLE } from './page-state.table';
// APP-05 swaps this import to the real module, `@splicewire/beam-ux/state`, and deletes the stub.
import { pageStateOf } from './page-state.stub';

describe('pageStateOf: one mapping from the transport to a page state (APP-8)', () => {
    it.each(PAGE_STATE_TABLE)('$name', ({ transport, outcome }) => {
        expect(pageStateOf(transport)).toEqual(outcome);
    });

    it('never retries a 4xx and never reads a failed read as empty or ready', () => {
        for (const { transport } of PAGE_STATE_TABLE) {
            const { state, retry } = pageStateOf(transport);
            if (transport.phase === 'answered' && transport.status >= 400 && transport.status < 500) {
                expect(retry).toBe('never');
            }
            if (transport.phase === 'network-error' || (transport.phase === 'answered' && transport.status >= 400)) {
                expect(['empty', 'ready']).not.toContain(state);
            }
        }
    });
});
