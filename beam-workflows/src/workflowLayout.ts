import type { BlueprintDraft } from './blueprint';

/**
 * Pure layout for the read-only workflow graph preview (beam-workflows-ux ticket 18): turn a blueprint
 * (places + transitions) into positioned `@xyflow` nodes/edges. Kept out of the component so the
 * layering + glyph logic is unit-testable without a DOM, and so the graph stays REF-BLIND (ticket 06):
 * it renders only the definition graph — never subject content or the `$ref` graph.
 *
 * Layout is a simple left-to-right LAYERING: BFS distance from the initial place(s) gives each place a
 * rank (column); places in a rank stack vertically. Back-edges (e.g. `revise` → draft) just render as
 * edges pointing left — no special handling, which is correct for the small cyclic graphs workflows are.
 */

export type GraphNode = {
    id: string;
    position: { x: number; y: number };
    data: { label: string; initial: boolean };
};

export type GraphEdge = {
    id: string;
    source: string;
    target: string;
    label: string;
    guarded: boolean;
    hasEffect: boolean;
};

/**
 * Column pitch = the rendered node width ({@link NODE_WIDTH}) plus a lane wide enough for an edge
 * label (`🔒⚡ send_legal` at 11px is ~100px). At a 200px pitch the 150px default node left a 50px
 * lane, so labels were clipped by or drawn over the neighbouring nodes.
 */
export const NODE_WIDTH = 150;
/** The rendered height of a place node (12px label + 6px vertical padding + border). */
export const NODE_HEIGHT = 32;
const X_GAP = NODE_WIDTH + 130;
const Y_GAP = 90;

/**
 * The fixed zoom the read-only graph renders at. A fit-to-pane zoom shrank a 10-place graph to ~0.3x
 * (4px labels) and the migrate wizard's half-width panes further still; a graph wider than its pane
 * now scrolls instead of shrinking past legibility. 0.9 keeps the 12px node label at ~11px.
 */
export const GRAPH_ZOOM = 0.9;
/** Inset around the laid-out graph, in screen px — room for the back-edge loops that bow past a node. */
export const GRAPH_PADDING = 28;

/** The laid-out graph's extent in flow coordinates (origin at the first node's top-left). */
export function layoutBounds(nodes: GraphNode[]): { width: number; height: number } {
    if (nodes.length === 0) return { width: 0, height: 0 };
    const width = Math.max(...nodes.map((n) => n.position.x)) + NODE_WIDTH;
    const height = Math.max(...nodes.map((n) => n.position.y)) + NODE_HEIGHT;
    return { width, height };
}

/**
 * The canvas the graph needs at {@link GRAPH_ZOOM}: the component uses the width as the canvas's
 * minimum (a wider pane just centres the graph) and the height as-is, so a two-row graph is not
 * floated in a 420px-tall box and a long graph scrolls horizontally at a readable scale.
 */
export function graphCanvasSize(nodes: GraphNode[]): { minWidth: number; height: number } {
    const { width, height } = layoutBounds(nodes);
    return {
        minWidth: Math.ceil(width * GRAPH_ZOOM + GRAPH_PADDING * 2),
        height: Math.max(120, Math.ceil(height * GRAPH_ZOOM + GRAPH_PADDING * 2)),
    };
}

/**
 * Rank every place by BFS distance from the initial marking. Unreachable places are pushed into a
 * trailing column so they still render (a disconnected/typo place stays visible, not dropped).
 */
export function rankPlaces(blueprint: BlueprintDraft): Map<string, number> {
    const rank = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const t of blueprint.transitions) {
        for (const from of t.from) {
            for (const to of t.to) {
                adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
            }
        }
    }

    const initial = blueprint.initial.length > 0 ? blueprint.initial : blueprint.places.slice(0, 1);
    const queue: string[] = [];
    for (const place of initial) {
        if (blueprint.places.includes(place) && !rank.has(place)) {
            rank.set(place, 0);
            queue.push(place);
        }
    }

    while (queue.length > 0) {
        const node = queue.shift() as string;
        const depth = rank.get(node) ?? 0;
        for (const next of adjacency.get(node) ?? []) {
            if (!rank.has(next)) {
                rank.set(next, depth + 1);
                queue.push(next);
            }
        }
    }

    // Unreached places (never targeted from the initial marking) go one column past the deepest rank.
    const maxRank = rank.size > 0 ? Math.max(...rank.values()) : 0;
    for (const place of blueprint.places) {
        if (!rank.has(place)) {
            rank.set(place, maxRank + 1);
        }
    }

    return rank;
}

/**
 * Position places into layered nodes and map transitions to labelled, glyphed edges (one per
 * `from`×`to` pair, so workflow-net markings render intact).
 */
export function layoutBlueprint(blueprint: BlueprintDraft): {
    nodes: GraphNode[];
    edges: GraphEdge[];
} {
    const rank = rankPlaces(blueprint);
    const initial = new Set(blueprint.initial);

    // Stack each rank's places vertically, in the blueprint's place order.
    const seenPerRank = new Map<number, number>();
    const nodes: GraphNode[] = blueprint.places.map((place) => {
        const r = rank.get(place) ?? 0;
        const row = seenPerRank.get(r) ?? 0;
        seenPerRank.set(r, row + 1);

        return {
            id: place,
            position: { x: r * X_GAP, y: row * Y_GAP },
            data: { label: place, initial: initial.has(place) },
        };
    });

    const placeSet = new Set(blueprint.places);
    const edges: GraphEdge[] = [];
    for (const t of blueprint.transitions) {
        const guarded = Boolean(t.guard);
        const hasEffect = (t.effects?.length ?? 0) > 0;
        const glyphs = `${guarded ? '🔒' : ''}${hasEffect ? '⚡' : ''}`;
        const label = glyphs ? `${glyphs} ${t.name}` : t.name;

        for (const from of t.from) {
            for (const to of t.to) {
                // Skip edges that reference an undeclared place — the graph is a legibility surface,
                // not a validator (the save path validates referential integrity).
                if (!placeSet.has(from) || !placeSet.has(to)) continue;

                edges.push({
                    id: `${t.name}:${from}->${to}`,
                    source: from,
                    target: to,
                    label,
                    guarded,
                    hasEffect,
                });
            }
        }
    }

    return { nodes, edges };
}
