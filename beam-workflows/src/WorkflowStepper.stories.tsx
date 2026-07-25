import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowActions, WorkflowStepperTrack } from './WorkflowStepper';
import { MockWorkflowsProvider } from './story-harness';
import { projection } from './story-fixtures';

/**
 * Catalog story for the runtime lifecycle Stepper (component-seams ticket 26; beam-workflows v2
 * ticket 07). MODEL-BLIND: renders whatever `places`/`current` it is handed. Two exported pieces:
 *  - {@link WorkflowStepperTrack} — the linear places track (its axis is **step position**: which
 *    place is current — first / middle / last — plus the `badgePlaces` escape to a distinct badge);
 *  - {@link WorkflowActions} — one button per backend-legal `available` transition, + confirm dialog.
 *
 * `WorkflowActions` reads the injected `subscribe` seam, so it renders inside the mock provider (which
 * supplies a no-op subscribe). The track is pure and needs no provider. No variant/size/tone/density
 * props (rule of sanction). The track chrome uses `--swc-*` brand vars with hex fallbacks — a
 * self-contained-hex property that does NOT fully re-skin under `.dark` (recorded honestly → ticket 32).
 */
const meta = {
    title: 'Workflows/WorkflowStepper',
    component: WorkflowStepperTrack,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof WorkflowStepperTrack>;

export default meta;
type Story = StoryObj<typeof meta>;

const PLACES = ['draft', 'in_review', 'published', 'archived'];

/** Current = the first place (nothing "past" yet). */
export const TrackAtStart: Story = {
    args: { places: PLACES, current: 'draft' },
};

/** Current = a middle place — earlier steps read as "past", later as "upcoming". */
export const TrackMidway: Story = {
    args: { places: PLACES, current: 'in_review' },
};

/** Current = the last place — every prior step is "past". */
export const TrackAtEnd: Story = {
    args: { places: PLACES, current: 'archived' },
};

/**
 * A `badgePlaces` place as the current marking — rendered as a distinct outline badge instead of a
 * track step (e.g. a reversible "pulled-back" state a host splits out).
 */
export const TrackBadgePlace: Story = {
    args: { places: [...PLACES, 'retracted'], current: 'retracted', badgePlaces: ['retracted'] },
};

/**
 * {@link WorkflowActions} — one `outline` Button per `available` transition off the fixture projection
 * (`approve`, `revise`). Rendered inside the mock provider (the `subscribe` seam is injected).
 */
export const Actions: StoryObj = {
    render: () => (
        <MockWorkflowsProvider>
            <div className="flex flex-wrap items-center gap-2">
                <WorkflowActions
                    projection={projection}
                    channel="workflow-subject.post.1"
                    onTransition={() => {}}
                    confirm={{
                        approve: {
                            title: 'Publish this post?',
                            description: 'It becomes visible immediately.',
                            emphasize: true,
                            confirmLabel: 'Publish',
                        },
                    }}
                />
            </div>
        </MockWorkflowsProvider>
    ),
};

/** Actions in the `pending` state — every button disabled with a spinner. */
export const ActionsPending: StoryObj = {
    render: () => (
        <MockWorkflowsProvider>
            <div className="flex flex-wrap items-center gap-2">
                <WorkflowActions
                    projection={projection}
                    channel="workflow-subject.post.1"
                    onTransition={() => {}}
                    pending
                />
            </div>
        </MockWorkflowsProvider>
    ),
};
