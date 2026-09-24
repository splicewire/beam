import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
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
/** The host refused the save: the play submits, so the frame is the refusal the story is named for. */
export const RefusedSave: Story = {
    args: { onSchedule: async () => { throw new Error('Permission to schedule this subject was revoked.'); } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Schedule transition' }));
        await expect(await canvas.findByRole('alert')).toHaveTextContent('Permission to schedule this subject was revoked.');
        await expect(canvas.getByRole('button', { name: 'Schedule transition' })).toBeEnabled();
    },
};
