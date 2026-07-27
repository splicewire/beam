import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { VersionsList } from './versions-list';
import { SAMPLE_VERSIONS, VersionsStage } from './story-harness';
import type { VersionData } from './types';

/**
 * Versioning / VersionsList — the pure, data-logic-free list (the presentational half of the
 * surface). It renders rows (readable handle, HEAD badge, label, relative time, optional injected
 * host chrome) and degrades into empty / loading / error states; the caller owns the data + the
 * restore gesture. `VersionsPanel` wraps this with the react-query hooks + restore dialog.
 *
 * Treatment axes (ADR-0116 §7): **states** — populated / empty / loading / error / view-only
 * (disabled) — plus the host-chrome slot (`renderVersionMeta`).
 */
const meta = {
    title: 'Versioning/VersionsList',
    component: VersionsList,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <VersionsStage>{Story()}</VersionsStage>],
} satisfies Meta<typeof VersionsList>;

export default meta;
type Story = StoryObj<typeof VersionsList<VersionData>>;

const noop = () => {};

export const Populated: Story = {
    render: () => <VersionsList versions={SAMPLE_VERSIONS} onRestore={noop} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('v3')).toBeInTheDocument();
        await expect(canvas.getByText('HEAD')).toBeInTheDocument();
    },
};

export const Empty: Story = {
    render: () => <VersionsList versions={[]} onRestore={noop} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/no versions yet/i)).toBeInTheDocument();
    },
};

export const Loading: Story = {
    render: () => <VersionsList versions={undefined} isLoading onRestore={noop} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/loading versions/i)).toBeInTheDocument();
    },
};

export const ErrorState: Story = {
    render: () => <VersionsList versions={undefined} isError onRestore={noop} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/could not load version history/i)).toBeInTheDocument();
    },
};

/** View-only — every Restore is disabled (a read-only admin). */
export const ViewOnly: Story = {
    render: () => <VersionsList versions={SAMPLE_VERSIONS} onRestore={noop} disabled />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByRole('button', { name: /Restore v2/i })).toBeDisabled();
    },
};

/** Host chrome — the injected per-row `renderVersionMeta` slot (ADR-0116 host-chrome kind). */
export const WithHostChrome: Story = {
    render: () => (
        <VersionsList
            versions={SAMPLE_VERSIONS}
            onRestore={noop}
            renderVersionMeta={(v) => (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    by {v.createdBy}
                </span>
            )}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText(/by usr_/i).length).toBeGreaterThan(0);
    },
};

/** Restore-gesture wiring — clicking a row's Restore surfaces the version to the caller. */
export const RestoreGesture: Story = {
    render: function RestoreGestureStory() {
        const [picked, setPicked] = useState<VersionData | null>(null);
        return (
            <div className="space-y-3">
                <VersionsList versions={SAMPLE_VERSIONS} onRestore={setPicked} />
                <p className="text-xs text-muted-foreground">
                    Picked: {picked ? picked.readable : '—'}
                </p>
            </div>
        );
    },
};
