import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowActionForm } from './WorkflowActionForm';

const meta = {
    title: 'Workflows/WorkflowActionForm',
    component: WorkflowActionForm,
    parameters: { layout: 'padded' },
    args: {
        subjectLabel: 'Example article — synthetic fixture',
        projection: {
            type: 'article', current: 'draft', places: ['draft', 'review', 'published', 'unpublished'],
            available: ['submit_for_review'],
            transitions: [
                { name: 'submit_for_review', from: ['draft'], to: ['review'], guard: null, effects: [], metadata: null },
                { name: 'publish', from: ['review'], to: ['published'], guard: null, effects: [], metadata: null },
                { name: 'unpublish', from: ['published'], to: ['unpublished'], guard: null, effects: [], metadata: null },
            ],
        },
        initialTransition: 'publish',
        initialLocalTime: '2026-09-15T09:30',
        initialTimezone: 'America/New_York',
        onSchedule: async () => {},
    },
    decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
} satisfies Meta<typeof WorkflowActionForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FutureTransition: Story = {};
export const RepeatedHour: Story = { args: { initialLocalTime: '2026-11-01T01:30' } };
export const MissingHour: Story = { args: { initialLocalTime: '2026-03-08T02:30' } };
export const RefusedSave: Story = { args: { onSchedule: async () => { throw new Error('Permission to schedule this subject was revoked.'); } } };
