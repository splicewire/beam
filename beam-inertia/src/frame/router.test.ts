/**
 * The Frame console's "New …" navigation (G2 defect 5, measured on beam.test 2026-09-11).
 *
 * `ListShell`'s Toolbar calls `onOpen({ id: null })` for its New button, and the WRITE leg has always
 * understood a null id — `transport.save` POSTs to the collection instead of PUTting a record. The
 * navigation leg stringified it, so New visited `/{resource}/null`, the record screen requested the
 * record literally named `null`, and the server answered 500: `invalid input syntax for type uuid:
 * "null"`. `String(null)` is a valid-looking URL segment and an invalid record id, which is why this
 * survived every type-check between the two legs.
 */
import { describe, expect, it } from 'vitest';
import { CREATE_SEGMENT, idFromParam, recordHref } from './router';

describe('recordHref', () => {
    it('routes a null id to the create segment, never to /null', () => {
        expect(recordHref('/git-repos', null)).toBe(`/git-repos/${CREATE_SEGMENT}`);
        expect(recordHref('/git-repos', null)).not.toContain('null');
    });

    it('treats undefined and empty the same way — all three mean "no record yet"', () => {
        expect(recordHref('/hooks', undefined)).toBe(`/hooks/${CREATE_SEGMENT}`);
        expect(recordHref('/hooks', '')).toBe(`/hooks/${CREATE_SEGMENT}`);
    });

    it('opens a real record at its own id', () => {
        expect(recordHref('/hooks', '01a001bc-0000-7000-8000-0000000000aa')).toBe(
            '/hooks/01a001bc-0000-7000-8000-0000000000aa',
        );
    });
});

describe('idFromParam', () => {
    it('undoes the sentinel so it can never reach the transport as an id', () => {
        expect(idFromParam(CREATE_SEGMENT)).toBeNull();
    });

    it('reports null for a missing param and passes a real id through', () => {
        expect(idFromParam(undefined)).toBeNull();
        expect(idFromParam('01a001bc-0000-7000-8000-0000000000aa')).toBe(
            '01a001bc-0000-7000-8000-0000000000aa',
        );
    });

    it('round-trips: what recordHref writes for a create, idFromParam reads back as null', () => {
        const segment = recordHref('/hooks', null).split('/').pop();

        expect(idFromParam(segment)).toBeNull();
    });
});
