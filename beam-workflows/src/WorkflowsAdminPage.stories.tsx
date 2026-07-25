import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowsAdminPage } from './WorkflowsAdminPage';
import { MockWorkflowsProvider, makeMockClient } from './story-harness';
import { lineages } from './story-fixtures';

/**
 * Catalog story for {@link WorkflowsAdminPage} (component-seams ticket 26; beam-workflows v2 ticket 09).
 * The root admin surface — the lineage list (aside), and, on selection, the BindingPanel + version
 * coverage strip + WorkflowDiff + collapsible WorkflowMigrate + the WorkflowEditor. It is the fully
 * TRANSPORT-DRIVEN composite: every panel reads through the injected `client` via react-query, so it
 * renders inside the mock provider.
 *
 * Its axis is **states** of the injected reads: populated list vs. empty list vs. still-loading. The
 * "selected lineage" deep state is driven by user click (the list starts unselected showing the "Select
 * a workflow…" hint) — the `play` fn on Selected clicks the first lineage so a VR baseline captures the
 * full composed editor. No variant/size/tone/density prop (rule of sanction). Chrome mixes semantic
 * tokens (`muted-foreground`, Card/Button/Select from `@schemastud/ui`) with `--swc-*` brand accents on
 * the selected-lineage ring + version badges — partial re-skin under `.dark` (→ ticket 32).
 */
const meta = {
    title: 'Workflows/WorkflowsAdminPage',
    component: WorkflowsAdminPage,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkflowsAdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The list populated with two lineages; nothing selected yet (the "Select a workflow…" hint). */
export const ListPopulated: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ lineages })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async () => {
        await new Promise((r) => setTimeout(r, 150));
    },
};

/** An empty estate — no lineages configured yet (the list renders nothing, the hint shows). */
export const ListEmpty: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ lineages: [] })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async () => {
        await new Promise((r) => setTimeout(r, 150));
    },
};

/** The reads hang forever — the "Loading…" state of the lineage list. */
export const Loading: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ hang: true })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
};

/**
 * A lineage selected — the full composed surface: BindingPanel, coverage strip, WorkflowDiff, the
 * migrate disclosure, and the WorkflowEditor loaded with the active version. The `play` fn clicks the
 * first lineage and waits for the graphs/editor to settle, so a VR baseline captures the composite.
 */
export const Selected: Story = {
    decorators: [
        (Story) => (
            <MockWorkflowsProvider client={makeMockClient({ lineages })}>
                <Story />
            </MockWorkflowsProvider>
        ),
    ],
    play: async ({ canvasElement }) => {
        await new Promise((r) => setTimeout(r, 150));
        const firstLineage = canvasElement.querySelector<HTMLButtonElement>('aside button');
        firstLineage?.click();
        await new Promise((r) => setTimeout(r, 350));
    },
};
