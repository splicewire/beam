import {
    Background,
    Controls,
    MarkerType,
    Position,
    ReactFlow,
    type Edge,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import type { BlueprintDraft } from './blueprint';
import { layoutBlueprint } from './workflowLayout';

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
    const { nodes, edges } = useMemo(() => {
        const layout = layoutBlueprint(blueprint);

        const rfNodes: Node[] = layout.nodes.map((n) => ({
            id: n.id,
            position: n.position,
            data: { label: n.data.label },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            // The initial place gets the accent ring so the entry point reads at a glance.
            style: {
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
            markerEnd: { type: MarkerType.ArrowClosed },
            style: e.guarded ? { stroke: 'var(--beam-amber)' } : undefined,
        }));

        return { nodes: rfNodes, edges: rfEdges };
    }, [blueprint]);

    return (
        <div className="h-[420px] w-full overflow-hidden rounded-md border border-[var(--beam-ink-08)]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
            >
                <Background />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
