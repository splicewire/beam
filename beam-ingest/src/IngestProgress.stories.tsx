import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { IngestProgress } from './IngestProgress';
import { IngestStage, pendingRun, runningRun, completedRun, failedRun } from './story-harness';
import type { IngestClient, IngestRunData } from './types';

/** Beam's global preview supplies semantic tokens plus light/dark; no host styles or fixtures. */
const meta = {
    title: 'Ingest/IngestProgress',
    component: IngestProgress,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof IngestProgress>;
export default meta;
type Story = StoryObj<typeof IngestProgress>;

export const Pending: Story = {
    render: () => (
        <IngestStage run={pendingRun}>
            <IngestProgress run={pendingRun} />
        </IngestStage>
    ),
};
export const Running: Story = {
    render: () => (
        <IngestStage run={runningRun}>
            <IngestProgress run={runningRun} />
        </IngestStage>
    ),
};
export const Completed: Story = {
    render: () => (
        <IngestStage run={completedRun}>
            <IngestProgress run={completedRun} />
        </IngestStage>
    ),
};
export const Failed: Story = {
    render: () => (
        <IngestStage run={failedRun}>
            <IngestProgress run={failedRun} />
        </IngestStage>
    ),
};

function RetryStage() {
    const [client] = useState<IngestClient>(() => {
        let attempts = 0;
        return {
            get: async () => {
                if (++attempts === 1) throw new Error('Temporarily unavailable');
                return completedRun;
            },
        };
    });
    return (
        <IngestStage run={pendingRun} client={client}>
            <IngestProgress run={pendingRun} />
        </IngestStage>
    );
}
/**
 * The read error with its Retry affordance reached from the keyboard — the state an operator acts
 * on. The play stops HERE on purpose: after Retry the run completes and the frame is identical to
 * `Completed`, which is not what this story is named for. Recovery-through-Retry is proven by
 * `tests/IngestProgress.test.tsx` ("recovers only through Retry"); the in-flight retry is `RetryBusy`.
 */
export const ReadErrorAndRetry: Story = {
    render: () => <RetryStage />,
    parameters: { vr: { keepFocus: true } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent('Temporarily unavailable');
        const retry = canvas.getByRole('button', { name: 'Retry' });
        await userEvent.tab();
        await expect(retry).toHaveFocus();
        await expect(retry).toBeEnabled();
    },
};
function StateMatrix() {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {[pendingRun, runningRun, completedRun, failedRun].map((run) => (
                <IngestStage key={run.status} run={run}>
                    <IngestProgress run={run} />
                </IngestStage>
            ))}
        </div>
    );
}
export const LightStates: Story = {
    globals: { colorScheme: 'light' },
    render: () => <StateMatrix />,
};
export const DarkStates: Story = {
    globals: { colorScheme: 'dark' },
    render: () => <StateMatrix />,
};
export const Mobile: Story = {
    globals: { viewport: { value: 'mobile1', isRotated: false } },
    render: () => (
        <div style={{ width: '100%', maxWidth: 320 }}>
            <IngestStage run={runningRun}>
                <IngestProgress run={runningRun} />
            </IngestStage>
        </div>
    ),
};
export const Desktop: Story = {
    render: () => (
        <div style={{ width: 760 }}>
            <IngestStage run={runningRun}>
                <IngestProgress run={runningRun} />
            </IngestStage>
        </div>
    ),
};

const unavailableClient: IngestClient = {
    get: async () => {
        throw new Error('Progress temporarily unavailable');
    },
};
export const ReadError: Story = {
    render: () => (
        <IngestStage run={pendingRun} client={unavailableClient}>
            <IngestProgress run={pendingRun} />
        </IngestStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent(
            'Progress temporarily unavailable',
        );
    },
};
function RetryBusyStage() {
    const [client] = useState<IngestClient>(() => {
        let attempts = 0;
        return {
            get: () =>
                ++attempts === 1
                    ? Promise.reject(new Error('Progress temporarily unavailable'))
                    : new Promise<IngestRunData>(() => {}),
        };
    });
    return (
        <IngestStage run={pendingRun} client={client}>
            <IngestProgress run={pendingRun} />
        </IngestStage>
    );
}
export const RetryBusy: Story = {
    render: () => <RetryBusyStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByRole('alert');
        await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
        await expect(await canvas.findByRole('button', { name: 'Checking…' })).toBeDisabled();
    },
};
