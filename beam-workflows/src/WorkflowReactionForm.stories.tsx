import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { WorkflowReactionForm } from './WorkflowReactionForm';

const meta = {
    title: 'Workflows/WorkflowReactionForm',
    component: WorkflowReactionForm,
    parameters: { layout: 'padded' },
    args: {
        subject: { subject_kind: 'article', subject_id: 'example' },
        subjectLabel: 'Example article — synthetic fixture',
        projection: {
            type: 'article',
            current: 'draft',
            places: ['draft', 'published'],
            available: ['publish'],
            transitions: [
                {
                    name: 'publish',
                    from: ['draft'],
                    to: ['published'],
                    guard: null,
                    effects: [],
                    metadata: null,
                    reason: null,
                },
                {
                    name: 'unpublish',
                    from: ['published'],
                    to: ['draft'],
                    guard: null,
                    effects: [],
                    metadata: null,
                    reason: null,
                },
            ],
        },
        initialTimezone: 'America/New_York',
        onConfigure: async () => {},
    },
    decorators: [
        (Story) => (
            <div className="max-w-xl">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WorkflowReactionForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ExpireAfterPublication: Story = {};
export const DistributionCircuit: Story = {
    args: {
        circuitChoices: [{ id: 'distribution', label: 'Distribute publication' }],
        circuitAction: (id) => ({
            action_kind: 'example.distribution',
            action_payload: { destination: id },
        }),
    },
    // The Circuit branch is behind the follow-up select; without choosing it the frame is the
    // default "Schedule another transition" form, identical to ExpireAfterPublication.
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.selectOptions(canvas.getByLabelText('Follow-up action'), 'circuit');
        await userEvent.selectOptions(await canvas.findByLabelText('Circuit'), 'distribution');
        await expect(canvas.getByLabelText('Circuit')).toHaveDisplayValue('Distribute publication');
        await expect(canvas.getByRole('button', { name: 'Add follow-up' })).toBeEnabled();
    },
};
// The host fills the Circuit slot with its own control (the flagship mounts its circuit field here). The stub sets an id
// that is not in any choices list, as a Circuit created in place would, and the form accepts it.
export const HostCircuitField: Story = {
    args: {
        circuitAction: (id) => ({
            action_kind: 'example.distribution',
            action_payload: { destination: id },
        }),
        renderCircuitField: ({ id, value, onChange, disabled }) => (
            <button
                type="button"
                id={id}
                disabled={disabled}
                className="rounded-md border border-input px-3 py-2 text-sm"
                onClick={() => onChange('created-in-place')}
            >
                {value ? `Chosen: ${value}` : 'Create a circuit (host stub)'}
            </button>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.selectOptions(canvas.getByLabelText('Follow-up action'), 'circuit');
        await expect(canvas.getByRole('button', { name: 'Add follow-up' })).toBeDisabled();
        await userEvent.click(await canvas.findByLabelText('Circuit'));
        await expect(canvas.getByLabelText('Circuit')).toHaveTextContent('Chosen: created-in-place');
        await expect(canvas.getByRole('button', { name: 'Add follow-up' })).toBeEnabled();
    },
};
export const RefusedSave: Story = {
    args: {
        onConfigure: async () => {
            throw new Error('Permission to configure this follow-up was revoked.');
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Add follow-up' }));
        await expect(await canvas.findByRole('alert')).toHaveTextContent(
            'Permission to configure this follow-up was revoked.',
        );
    },
};
