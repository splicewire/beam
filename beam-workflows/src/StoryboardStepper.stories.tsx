import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoryboardStepper, type StoryboardStep } from './StoryboardStepper';
import { projection } from './story-fixtures';
import { workflowProjectionToSteps } from './workflowSteps';

/**
 * Catalog story for the storyboard stepper (owner-review-20261112 ticket 30). The same keyed steps show as a rail and
 * as a storyboard; selecting a step in either selects it in both, and the open state is shared. Plain steps, no
 * provider. The last story feeds it through the separate workflow adapter.
 */
const meta = {
    title: 'Workflows/StoryboardStepper',
    component: StoryboardStepper,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof StoryboardStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS: StoryboardStep[] = [
    {
        key: 'collect',
        label: 'Collect the brief',
        summary: 'When a request arrives, read its brief and attachments.',
        status: 'done',
        body: 'Reads the request form and every attached file.',
        wire: 'The brief, as text',
    },
    {
        key: 'draft',
        label: 'Draft a reply',
        summary: 'Write a first reply from the brief.',
        status: 'current',
        body: 'Uses the house tone. A reviewer sees the draft before it is sent.',
        wire: 'The draft reply',
    },
    {
        key: 'review',
        label: 'Review',
        summary: 'A person approves or sends the draft back.',
        status: 'upcoming',
        body: 'Approve sends it on; revise returns it to the draft step.',
        wire: 'The approved reply',
    },
    { key: 'send', label: 'Send', summary: 'Email the approved reply to the requester.', status: 'upcoming' },
];

/** A linear set with a wire after each step, the current step selected and open. */
export const Linear: Story = {
    args: { steps: STEPS, defaultOpenKeys: ['draft'] },
};

/** Nothing open: the storyboard reads as one sentence per step. */
export const Closed: Story = {
    args: { steps: STEPS },
};

/** The same stepper from a workflow projection through `workflowProjectionToSteps` (the fixture's marking is in_review). */
export const FromWorkflowProjection: Story = {
    args: {
        steps: workflowProjectionToSteps(projection, {
            summary: (place) => `The post is ${place.replace(/_/g, ' ')}.`,
        }),
        defaultOpenKeys: [projection.current],
    },
};
