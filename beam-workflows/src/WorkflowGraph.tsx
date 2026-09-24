import {
    Background,
    MarkerType,
    Position,
    ReactFlow,
    type Edge,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BlueprintDraft } from './blueprint';
import { GRAPH_PADDING, GRAPH_ZOOM, graphCanvasSize, layoutBlueprint, NODE_WIDTH } from './workflowLayout';

/**
 * A READ-ONLY `@xyflow` view of a workflow definition (beam-workflows-ux ticket 18, Surface 1 of the
 * confidence surfaces). Places → nodes, transitions → edges (🔒 guarded, ⚡ has effect), auto-laid-out
 * left-to-right. The schema-form stays the authoring seam — this is a legibility nicety, never an
 * editable canvas (no drag/connect/select affordances).
 *
 * REF-BLIND (ticket 06): it renders only the definition graph — places/transitions/guards/effects —
 * never subject content or the `$ref` graph. Parameterised by a `blueprint`, so the marking-migration
 * wizard (ticket 20) reuses it verbatim as its before/after render.
 */
export function WorkflowGraph({ blueprint }: { blueprint: BlueprintDraft }) {
    const { nodes, edges, canvas } = useMemo(() => {
        const layout = layoutBlueprint(blueprint);
        const canvas = graphCanvasSize(layout.nodes);

        const rfNodes: Node[] = layout.nodes.map((n) => ({
            id: n.id,
            position: n.position,
            data: { label: n.data.label },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            // The initial place gets the accent ring so the entry point reads at a glance.
            style: {
                width: NODE_WIDTH,
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                border: n.data.initial
                    ? '2px solid var(--beam-green)'
                    : '1px solid var(--beam-ink-15)',
                background: 'var(--beam-surface)',
            },
        }));

        const rfEdges: Edge[] = layout.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            labelStyle: { fontSize: 11 },
            // A padded chip behind the label so it stays legible where it crosses another edge.
            labelBgPadding: [4, 2] as [number, number],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: 'var(--beam-surface, #fff)' },
            markerEnd: { type: MarkerType.ArrowClosed },
            style: e.guarded ? { stroke: 'var(--beam-amber)' } : undefined,
        }));

        return { nodes: rfNodes, edges: rfEdges, canvas };
    }, [blueprint]);

    // Whether the graph is wider than its pane. A headless capture and an overlay-scrollbar OS both
    // hide the scrollbar, so a clipped graph needs a visible cue that the rest is a scroll away.
    const pane = useRef<HTMLDivElement>(null);
    const [overflowing, setOverflowing] = useState(false);
    useLayoutEffect(() => {
        const el = pane.current;
        if (!el) return;
        // Overflow within the padding clips only empty inset, never a place; don't cue a scroll for it.
        const measure = () => setOverflowing(el.scrollWidth - el.clientWidth > GRAPH_PADDING);
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [canvas.minWidth, nodes.length]);

    if (nodes.length === 0) {
        return (
            <div className="flex h-[420px] w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--beam-ink-08)] p-6 text-center">
                <p className="text-sm font-medium">No places yet</p>
                <p className="text-xs text-muted-foreground">
                    Add a place to the workflow and its graph will draw here.
                </p>
            </div>
        );
    }

    // A FIXED, legible zoom on a canvas sized to the laid-out graph (graphCanvasSize): a graph wider
    // than its pane scrolls horizontally rather than fit-view shrinking it until the labels are ~4px
    // (a 10-place graph landed at ~0.3x; the migrate wizard's half-width panes smaller still). fitView
    // with min = max zoom only CENTRES the graph when the pane is wider than it. The canvas is a static
    // preview, so xyflow's own pan/zoom gestures are off and a wheel scrolls the page or the pane.
    return (
        <div className="w-full min-w-0">
            <div
                ref={pane}
                className="w-full overflow-x-auto rounded-md border border-[var(--beam-ink-08)]"
                data-testid="workflow-graph"
            >
                <div style={{ minWidth: canvas.minWidth, height: canvas.height }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        fitView
                        fitViewOptions={{ padding: 0, minZoom: GRAPH_ZOOM, maxZoom: GRAPH_ZOOM }}
                        minZoom={GRAPH_ZOOM}
                        maxZoom={GRAPH_ZOOM}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnDrag={false}
                        zoomOnScroll={false}
                        zoomOnPinch={false}
                        zoomOnDoubleClick={false}
                        preventScrolling={false}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background />
                    </ReactFlow>
                </div>
            </div>
            {overflowing && (
                <p
                    className="mt-1 text-right text-[11px] text-muted-foreground"
                    data-testid="workflow-graph-scroll-hint"
                >
                    Scroll sideways to see all {nodes.length} places →
                </p>
            )}
        </div>
    );
}
