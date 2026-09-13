import type { Meta, StoryObj } from '@storybook/react-vite';
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
};
export const RefusedSave: Story = {
    args: {
        onConfigure: async () => {
            throw new Error('Permission to configure this follow-up was revoked.');
        },
    },
};
