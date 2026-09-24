import { describe, expect, it } from 'vitest';
import type { BlueprintDraft } from './blueprint';
import {
    GRAPH_PADDING,
    GRAPH_ZOOM,
    graphCanvasSize,
    layoutBlueprint,
    layoutBounds,
    NODE_WIDTH,
    rankPlaces,
} from './workflowLayout';

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
        expect(nodes.find((n) => n.id === 'review')?.position.x).toBe(280);
        expect(nodes.find((n) => n.id === 'draft')?.data.initial).toBe(true);
        expect(nodes.find((n) => n.id === 'review')?.data.initial).toBe(false);
    });

    it('leaves a lane between adjacent columns wide enough for an edge label', () => {
        const { nodes } = layoutBlueprint(lifecycle);
        const draft = nodes.find((n) => n.id === 'draft')!;
        const review = nodes.find((n) => n.id === 'review')!;
        expect(review.position.x - (draft.position.x + NODE_WIDTH)).toBeGreaterThanOrEqual(120);
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

describe('graphCanvasSize — a fixed legible zoom, not a fit-to-pane shrink', () => {
    it('sizes the canvas to the laid-out graph at GRAPH_ZOOM, padded on both sides', () => {
        const { nodes } = layoutBlueprint(lifecycle);
        const bounds = layoutBounds(nodes);
        const canvas = graphCanvasSize(nodes);

        expect(canvas.minWidth).toBe(Math.ceil(bounds.width * GRAPH_ZOOM + GRAPH_PADDING * 2));
        // A one-row graph is not floated in the old fixed 420px box.
        expect(canvas.height).toBeLessThan(420);
    });

    it('grows the canvas with the graph instead of shrinking the zoom', () => {
        const long: BlueprintDraft = {
            name: 'long',
            metadata: null,
            places: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
            initial: ['a'],
            transitions: ['a', 'b', 'c', 'd', 'e', 'f'].map((from, i) => ({
                name: `t${i}`,
                from: [from],
                to: [String.fromCharCode(from.charCodeAt(0) + 1)],
                guard: null,
                effects: [],
                metadata: null,
            })),
        };
        const short = graphCanvasSize(layoutBlueprint(lifecycle).nodes).minWidth;
        expect(graphCanvasSize(layoutBlueprint(long).nodes).minWidth).toBeGreaterThan(short);
        // At the render zoom a 12px node label stays legible (>= 10px).
        expect(12 * GRAPH_ZOOM).toBeGreaterThanOrEqual(10);
    });

    it('has no extent for an empty graph', () => {
        expect(layoutBounds([])).toEqual({ width: 0, height: 0 });
    });
});
