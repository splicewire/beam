import { describe, expect, it } from 'vitest';
import type { BlueprintDraft } from './blueprint';
import { layoutBlueprint, rankPlaces } from './workflowLayout';

// The pure layering + glyph seam behind the read-only graph preview (ticket 18). Pins the ref-blind
// definition→graph mapping (places→ranked nodes, transitions→glyphed edges) without a DOM.

const lifecycle: BlueprintDraft = {
    name: 'composition.lifecycle',
    places: ['draft', 'review', 'published', 'unpublished'],
    initial: ['draft'],
    transitions: [
        {
            name: 'submit_for_review',
            from: ['draft'],
            to: ['review'],
            guard: 'no_stale',
            effects: [],
            metadata: null,
        },
        {
            name: 'publish',
            from: ['review'],
            to: ['published'],
            guard: null,
            effects: ['notify'],
            metadata: null,
        },
        {
            name: 'unpublish',
            from: ['published'],
            to: ['unpublished'],
            guard: null,
            effects: [],
            metadata: null,
        },
        {
            name: 'revise',
            from: ['unpublished'],
            to: ['draft'],
            guard: null,
            effects: [],
            metadata: null,
        },
    ],
    metadata: null,
} as BlueprintDraft;

describe('rankPlaces', () => {
    it('ranks by BFS distance from the initial place', () => {
        const rank = rankPlaces(lifecycle);
        expect(rank.get('draft')).toBe(0);
        expect(rank.get('review')).toBe(1);
        expect(rank.get('published')).toBe(2);
        expect(rank.get('unpublished')).toBe(3);
    });

    it('parks an unreachable place in a trailing column instead of dropping it', () => {
        const orphaned = {
            ...lifecycle,
            places: [...lifecycle.places, 'archived'],
        } as BlueprintDraft;
        const rank = rankPlaces(orphaned);
        expect(rank.get('archived')).toBe(4); // one past the deepest reachable rank (3)
    });
});

describe('layoutBlueprint', () => {
    it('positions one node per place, left-to-right by rank', () => {
        const { nodes } = layoutBlueprint(lifecycle);
        expect(nodes).toHaveLength(4);
        expect(nodes.find((n) => n.id === 'draft')?.position.x).toBe(0);
        expect(nodes.find((n) => n.id === 'review')?.position.x).toBe(200);
        expect(nodes.find((n) => n.id === 'draft')?.data.initial).toBe(true);
        expect(nodes.find((n) => n.id === 'review')?.data.initial).toBe(false);
    });

    it('maps transitions to glyphed edges (🔒 guarded, ⚡ effect)', () => {
        const { edges } = layoutBlueprint(lifecycle);
        const submit = edges.find((e) => e.source === 'draft' && e.target === 'review');
        const publish = edges.find((e) => e.source === 'review' && e.target === 'published');

        expect(submit?.guarded).toBe(true);
        expect(submit?.label).toBe('🔒 submit_for_review');
        expect(publish?.hasEffect).toBe(true);
        expect(publish?.label).toBe('⚡ publish');
        // The back-edge (revise) still renders as an edge pointing to an earlier rank.
        expect(edges.some((e) => e.source === 'unpublished' && e.target === 'draft')).toBe(true);
    });

    it('emits one edge per from×to pair and skips undeclared places', () => {
        const net = {
            name: 'net',
            places: ['a', 'b'],
            initial: ['a'],
            transitions: [
                {
                    name: 'fork',
                    from: ['a'],
                    to: ['a', 'b'],
                    guard: null,
                    effects: [],
                    metadata: null,
                },
                {
                    name: 'ghost',
                    from: ['a'],
                    to: ['missing'],
                    guard: null,
                    effects: [],
                    metadata: null,
                },
            ],
            metadata: null,
        } as BlueprintDraft;

        const { edges } = layoutBlueprint(net);
        expect(edges.map((e) => e.id).sort()).toEqual(['fork:a->a', 'fork:a->b']); // ghost→missing dropped
    });
});
