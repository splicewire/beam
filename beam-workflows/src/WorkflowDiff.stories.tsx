import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowDiff } from './WorkflowDiff';
import { versionsIdentical, versionsV1V2 } from './story-fixtures';

/**
 * Catalog story for {@link WorkflowDiff} (component-seams ticket 26; beam-workflows-ux Surface 2).
 * A read-only structural diff of two DEFINITION versions — places ± and per-transition guard/effect ~,
 * picked via two version SimpleSelects. Prop-driven (takes `versions` + `lineageKey`), no transport.
 * Its only axis is the **states** of the delta it renders: no-change vs. added/removed/changed. It
 * exposes no variant/size/tone/density prop (rule of sanction: absent, not a gap).
 *
 * The `-` sign uses the semantic `text-destructive` token, so the removed rows DO re-skin under `.dark`;
 * added (`--swc-green`) and changed (`--swc-amber`) use brand vars with hex fallbacks — a partial
 * self-contained-hex property, recorded honestly (full re-treatment is ticket 32).
 */
const meta = {
    title: 'Workflows/WorkflowDiff',
    component: WorkflowDiff,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <div className="w-[560px] max-w-full">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WorkflowDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * V1 → V2 of the publish flow: an added `archived` place, an added `archive` transition, and a
 * `changed` approve (guard dropped + an effect added). The default from/to select the last two versions,
 * so this renders the full delta immediately.
 */
export const Changed: Story = {
    args: { versions: versionsV1V2, lineageKey: 'publish_flow' },
};

/** Two structurally-identical versions — the "No structural changes" empty-delta message. */
export const NoChange: Story = {
    args: { versions: versionsIdentical, lineageKey: 'publish_flow' },
};
