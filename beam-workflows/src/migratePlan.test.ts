import { expect, it } from 'vitest';
import {
    blockedHeadline,
    initialPlaceMap,
    mapComplete,
    type MigrationReport,
    resolvedMap,
} from './migratePlan';

// The pure planning seam behind the migration wizard (ticket 20): default place map, completeness gate,
// and the all-or-nothing headline. Pins the "removed place needs an explicit choice" + "N blocked all M"
// rules without a DOM.

it('defaults each place to its same-named target, leaving removed places unmapped', () => {
    const map = initialPlaceMap(['draft', 'review', 'expedite'], ['draft', 'review', 'live']);
    expect(map).toEqual({ draft: 'draft', review: 'review', expedite: '' }); // `expedite` removed → must choose
});

it('gates completeness on every place being mapped', () => {
    expect(mapComplete({ draft: 'draft', expedite: '' })).toBe(false);
    expect(mapComplete({ draft: 'draft', expedite: 'live' })).toBe(true);
    expect(mapComplete({})).toBe(false);
});

it('resolves to only the non-empty mappings for the request', () => {
    expect(resolvedMap({ draft: 'draft', expedite: '' })).toEqual({ draft: 'draft' });
});

it('foregrounds the all-or-nothing headline only when blocked', () => {
    const base: MigrationReport = {
        lineageKey: 'wf',
        fromVersionId: 'a',
        toVersionId: 'b',
        total: 142,
        migrated: 0,
        unmappable: [],
        applied: false,
        dryRun: true,
    };
    expect(blockedHeadline({ ...base, unmappable: [] })).toBeNull();
    expect(
        blockedHeadline({
            ...base,
            unmappable: [
                { id: '1', place: 'x' },
                { id: '2', place: 'y' },
                { id: '3', place: 'z' },
            ],
        }),
    ).toBe('3 records blocked all 142 — nothing was migrated.');
});
