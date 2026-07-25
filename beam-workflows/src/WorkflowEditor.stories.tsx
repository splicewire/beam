import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowEditor } from './WorkflowEditor';
import { toDraft } from './blueprint';
import { effects, emptyBlueprint, guards, principals, publishBlueprintV1 } from './story-fixtures';

/**
 * Catalog story for {@link WorkflowEditor} (component-seams ticket 26; beam-workflows v2 ticket 08).
 * The SCHEMA-FORM over the WorkflowBlueprint shape — places, transitions (from/to native multi-select),
 * initial marking, per-transition guard PICKED FROM THE CATALOG with params, and attachable effects
 * (whose array params dispatch to the RecipientPicker). NO transport — it takes an `onSave` callback,
 * so it needs no provider.
 *
 * Its axes are **states**: new/empty vs. populated (a real blueprint loaded), the `saving` flag, and an
 * inline server `error`. There is an internal edit/graph tab toggle (a component-defined view switch,
 * not a ticket-13 `variant` prop) exercised by the Populated story defaulting to the edit view. No
 * variant/size/tone/density prop on the component itself (rule of sanction). Chrome mixes semantic
 * tokens (`destructive`, Card/Input/Button from `@schemastud/ui`) with `--swc-*` brand accents on the
 * tab underline + section labels — partial re-skin under `.dark` (→ ticket 32).
 */
const meta = {
    title: 'Workflows/WorkflowEditor',
    component: WorkflowEditor,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <div className="w-[720px] max-w-full">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WorkflowEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A fresh workflow — empty places/transitions, ready to author from scratch. */
export const NewEmpty: Story = {
    args: {
        initial: toDraft(emptyBlueprint),
        guards,
        effects,
        principals,
        onSave: () => {},
    },
};

/**
 * A populated blueprint (the publish flow): three places, three transitions, a guarded `approve` with a
 * notify effect. Shows the catalog-picked guard select + the attachable-effects "When it fires" block.
 */
export const Populated: Story = {
    args: {
        initial: toDraft(publishBlueprintV1),
        guards,
        effects,
        principals,
        onSave: () => {},
    },
};

/** Mid-save — the "Saving…" disabled state. */
export const Saving: Story = {
    args: {
        initial: toDraft(publishBlueprintV1),
        guards,
        effects,
        principals,
        saving: true,
        onSave: () => {},
    },
};

/** A server-side validation error surfaced inline above the form (the invalid state). */
export const WithError: Story = {
    args: {
        initial: toDraft(publishBlueprintV1),
        guards,
        effects,
        principals,
        error: 'Transition "approve" references an undeclared place "publushed".',
        onSave: () => {},
    },
};
