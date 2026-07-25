import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowGraph } from './WorkflowGraph';
import { emptyBlueprint, largeBlueprint, publishBlueprintV1, singlePlaceBlueprint } from './story-fixtures';

/**
 * Catalog story for {@link WorkflowGraph} (component-seams ticket 26; beam-workflows-ux Surface 1).
 * The READ-ONLY `@xyflow` definition view — places → nodes, transitions → glyphed edges, laid out
 * left-to-right by BFS rank. It exposes no treatment props (no variant/size/tone/density) — its ONLY
 * axis is the **states/shape** of the blueprint it renders, so those are the stories: empty → small →
 * populated → large.
 *
 * HONEST NOTES:
 *  - **Deterministic layout, non-deterministic viewport.** The node/edge POSITIONS come from the pure
 *    `layoutBlueprint` (BFS rank — fully deterministic, so nodes never jump). But `<ReactFlow fitView>`
 *    then pans/zooms to fit; that transform can differ headless vs. on-screen. The `play` fn below
 *    waits for the `.react-flow__node` elements to settle so a VR baseline captures rendered nodes, but
 *    a graph VR snapshot may still carry viewport jitter — the same class of caveat as ticket 22's RBC
 *    drag note. Prefer asserting node presence over pixel-exact pan.
 *  - **Self-contained hex, not semantic tokens (→ ticket 32).** The node borders/background use
 *    `--swc-*` brand vars with hardcoded hex fallbacks (`var(--swc-green)`, `#d4d4d8`, `#fff`), so the
 *    graph chrome does NOT re-skin under `.dark`. This is a *pre-existing* property recorded here, not
 *    fixed in this catalog pass; re-treating the graph to semantic tokens is ticket 32.
 */
const meta = {
    title: 'Workflows/WorkflowGraph',
    component: WorkflowGraph,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story) => (
            <div className="h-[460px] w-[720px] max-w-full p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WorkflowGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Wait for the graph nodes to render + fitView to settle, so VR captures the laid-out state. */
const awaitGraph: Story['play'] = async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 250));
    // The nodes render into a portal-free container inside the ReactFlow root.
    canvasElement.querySelectorAll('.react-flow__node');
};

/** An empty blueprint — the graph renders its chrome (Background + Controls) with no nodes. */
export const Empty: Story = {
    args: { blueprint: emptyBlueprint },
    play: awaitGraph,
};

/** A single-place trivial workflow — one accent-ringed initial node, no edges. */
export const SingleNode: Story = {
    args: { blueprint: singlePlaceBlueprint },
    play: awaitGraph,
};

/** The canonical small publish flow: draft → in_review → published with a guarded + a back-edge. */
export const Populated: Story = {
    args: { blueprint: publishBlueprintV1 },
    play: awaitGraph,
};

/** A larger editorial pipeline — multiple branches, back-edges, and an unreachable-place trailing column. */
export const Large: Story = {
    args: { blueprint: largeBlueprint },
    play: awaitGraph,
};
