import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ReloadActivityCard } from './ReloadActivityCard';
import { ACTIVITY_ALL_FAILED, ACTIVITY_EMPTY, ACTIVITY_POPULATED } from './story-harness';

/**
 * Commerce / ReloadActivityCard — the auto-reload attempt-ledger read surface: the last reload
 * tile + the attempt-history `DataTable` with honest per-outcome badges (success is affirmative;
 * everything else reads as a failure). Pure presentational — takes an `AutoReloadActivity` prop
 * (no injected client needed), so it catalogues off fixtures directly.
 *
 * Treatment axis: **states** — populated (mixed outcomes) / empty (no reloads yet) / all-failed
 * (declined + sca + retrying, no successful last-reload).
 */
const meta = {
    title: 'Commerce/ReloadActivityCard',
    component: ReloadActivityCard,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-2xl p-4">{Story()}</div>],
} satisfies Meta<typeof ReloadActivityCard>;

export default meta;
type Story = StoryObj<typeof ReloadActivityCard>;

/** Populated — mixed outcomes, a successful last reload. */
export const Populated: Story = {
    args: { activity: ACTIVITY_POPULATED },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Reloaded')).toBeInTheDocument();
    },
};

/** Empty — no reloads yet (the DataTable empty message + "—" last reload). */
export const Empty: Story = {
    args: { activity: ACTIVITY_EMPTY },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('No automatic reloads yet.')).toBeInTheDocument();
    },
};

/** All failed — every attempt a failure, no successful last-reload. */
export const AllFailed: Story = {
    args: { activity: ACTIVITY_ALL_FAILED },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Auth required')).toBeInTheDocument();
    },
};
