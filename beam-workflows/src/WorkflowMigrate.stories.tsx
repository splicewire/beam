import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowMigrate } from './WorkflowMigrate';
import { MockWorkflowsProvider, makeMockClient } from './story-harness';
import { versionsV1V2 } from './story-fixtures';

/**
 * Catalog story for {@link WorkflowMigrate} (component-seams ticket 26; beam-workflows-ux Surface 3).
 * The marking-migration wizard — the map's highest blast radius. Flow: pick from/to → map places →
 * dry-run → actuate. It ROUTES through the injected `client.migrate` (the only transport-driven leaf
 * here besides the admin page), so it renders inside the mock provider. Before/after reuse the
 * read-only {@link WorkflowGraph}.
 *
 * Its axis is **states**: the seeded place-mapping form (default from/to = oldest/newest), and — after a
 * dry-run — a clean-preview report. The all-or-nothing blocked-headline state is unreachable from the
 * mock (the mock `migrate` returns a clean report), so it is documented but not storied. No
 * variant/size/tone/density prop (rule of sanction). Amber "danger zone" chrome uses `--swc-amber` brand
 * vars with hex fallbacks + the semantic `destructive` token for the blocked case — partial re-skin
 * under `.dark` (→ ticket 32).
 */
const meta = {
    title: 'Workflows/WorkflowMigrate',
    component: WorkflowMigrate,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient()}>
                <div className="w-[760px] max-w-full">
                    <Story />
                </div>
            </MockWorkflowsProvider>
        ),
    ],
} satisfies Meta<typeof WorkflowMigrate>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The migration plan: from v1 → v2 of the publish flow, before/after graphs, and the explicit
 * old→new place mapping (draft/in_review/published seed to same-name; the new `archived` place is a
 * target). "Preview (dry run)" is enabled once every place maps.
 */
export const Plan: Story = {
    args: { versions: versionsV1V2, lineageKey: 'publish_flow' },
    play: async () => {
        // Let the before/after WorkflowGraph fitView settle so a VR baseline captures laid-out nodes.
        await new Promise((r) => setTimeout(r, 300));
    },
};
