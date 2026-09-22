import { describe, expect, it } from 'vitest';
import { idFromParam, recordHref } from './router';

describe('record route identity', () => {
    it('preserves literal record IDs, including new, without a create sentinel', () => {
        expect(recordHref('/hooks', 'new')).toBe('/hooks/new');
        expect(idFromParam('new')).toBe('new');
        expect(idFromParam('record-1')).toBe('record-1');
    });

    it('uses null only when the static create route supplies no id parameter', () => {
        expect(idFromParam(undefined)).toBeNull();
        expect(idFromParam('null')).toBe('null');
    });
});
