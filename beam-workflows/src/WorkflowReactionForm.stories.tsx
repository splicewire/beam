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
                },
                {
                    name: 'unpublish',
                    from: ['published'],
                    to: ['draft'],
                    guard: null,
                    effects: [],
                    metadata: null,
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
