import { describe, expect, it } from 'vitest';
import {
    humanizeWorkflowKey,
    principalRows,
    toggleToken,
    diffBlueprints,
    layoutBlueprint,
    initialPlaceMap,
    type BlueprintDraft,
} from '../src/index';

/**
 * The slice-02 isolation bar (rehome-components §8a, DOM-free tier): the public barrel resolves
 * off nothing but the package + its `@splicewire/_resources` DTO edge — no Laravel, no `@/`. If a
 * logic module had smuggled an app coupling (or the DTO projection failed to travel as a
 * dependency), importing `../src/index` here would fail to resolve and this file would not load.
 * The per-module `*.test.ts` files carry the exhaustive behaviour; this proves the barrel.
 */
describe('@splicewire/beam-workflows barrel resolves in isolation', () => {
    it('re-exports the pure logic modules off the DTO projection', () => {
        expect(humanizeWorkflowKey('review_gate')).toBe('Review gate');

        const rows = principalRows([{ kind: 'owner', label: 'Owner' }]);
        expect(rows).toEqual([{ token: 'owner:', label: 'Owner', group: 'flat' }]);
        expect(toggleToken(['owner:'], 'owner:')).toEqual([]);

        const draft: BlueprintDraft = {
            name: 'flow',
            places: ['draft', 'published'],
            initial: ['draft'],
            transitions: [
                { name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null },
            ],
            metadata: null,
        };
        expect(layoutBlueprint(draft).nodes).toHaveLength(2);
        expect(isEmptyDiffOf(draft)).toBe(true);
        expect(initialPlaceMap(['draft'], ['draft', 'published']).draft).toBe('draft');
    });
});

function isEmptyDiffOf(draft: BlueprintDraft): boolean {
    const diff = diffBlueprints(draft, draft);
    return diff.places.added.length === 0 && diff.places.removed.length === 0;
}
