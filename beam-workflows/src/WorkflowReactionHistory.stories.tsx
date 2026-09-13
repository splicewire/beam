import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowReactionHistory } from './WorkflowReactionHistory';

const meta = {
    title: 'Workflows/WorkflowReactionHistory',
    component: WorkflowReactionHistory,
    parameters: { layout: 'padded' },
    args: {
        reactions: [
            {
                id: 'binding:example',
                revision: 1,
                enabled: true,
                configuration: {
                    subject_kind: 'article',
                    subject_id: 'example',
                    transition: 'publish',
                    action_kind: 'kind.workflow-transition',
                    action_payload: {
                        subject_kind: 'article',
                        subject_id: 'example',
                        transition: 'unpublish',
                    },
                    calendar_days: 30,
                    timezone: 'America/New_York',
                    calendar_id: 'calendar:example',
                },
                deliveries: [
                    {
                        id: 'delivery:old',
                        status: 'superseded',
                        transition_id: 'fact:old',
                        action_id: 'action:old',
                        anchored_at: '2026-03-01T14:00:00Z',
                        attempts: 1,
                        blockers: [],
                    },
                    {
                        id: 'delivery:current',
                        status: 'blocked',
                        transition_id: 'fact:current',
                        action_id: null,
                        anchored_at: '2026-03-03T14:00:00Z',
                        attempts: 1,
                        blockers: [
                            'The principal no longer has permission to schedule this transition.',
                        ],
                    },
                ],
            },
        ],
        onDisable: async () => {},
        onRetry: async () => {
            throw new Error('Permission is still unavailable. Restore permission before retrying.');
        },
    },
    decorators: [
        (Story) => (
            <div className="max-w-xl">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof WorkflowReactionHistory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const BlockedAndSuperseded: Story = {};
export const Empty: Story = { args: { reactions: [] } };
