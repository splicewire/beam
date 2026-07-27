import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { VersionsPanel } from './versions-panel';
import { MockVersionsProvider, SAMPLE_VERSIONS, VersionsStage } from './story-harness';

/**
 * Versioning / VersionsPanel — the record-agnostic version-history surface (the package's
 * customer-zero component), extracted from the composition VersionsDrawer. Portable, DTO-first:
 * owns its react-query data logic, types off the record-agnostic `VersionData` shape, and takes
 * transport + feedback + host chrome as injected services via `<VersionsProvider>`. Composes the
 * foundation `Badge`, `Button`, and `Dialog`.
 *
 * Treatment axes (ADR-0116 §7): **states** dominates — populated / restore-flow / empty / loading
 * / error / view-only (disabled). Ambient light⊗dark inherited from the foundation tokens.
 */
const meta = {
    title: 'Versioning/VersionsPanel',
    component: VersionsPanel,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <VersionsStage>{Story()}</VersionsStage>],
} satisfies Meta<typeof VersionsPanel>;

export default meta;
type Story = StoryObj<typeof VersionsPanel>;

/** Populated — three versions, HEAD flagged on v3. `play` awaits a settled row. */
export const Populated: Story = {
    render: () => (
        <MockVersionsProvider config={{ versions: SAMPLE_VERSIONS }}>
            <VersionsPanel />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('v3')).toBeInTheDocument();
        await expect(canvas.getByText('HEAD')).toBeInTheDocument();
    },
};

/** Restore flow — `play` clicks Restore on v2 so VR captures the confirm dialog. */
export const RestoreFlow: Story = {
    render: () => (
        <MockVersionsProvider config={{ versions: SAMPLE_VERSIONS }}>
            <VersionsPanel />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByText('v2');
        await userEvent.click(canvas.getByRole('button', { name: /Restore v2/i }));
        const dialog = within(document.body);
        await expect(await dialog.findByText(/Restore v2\?/i)).toBeInTheDocument();
    },
};

/** Empty — no versions yet (the save-to-capture hint). */
export const Empty: Story = {
    render: () => (
        <MockVersionsProvider config={{ listState: 'empty' }}>
            <VersionsPanel />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/no versions yet/i)).toBeInTheDocument();
    },
};

/** Loading — the history is fetching. */
export const Loading: Story = {
    render: () => (
        <MockVersionsProvider config={{ listState: 'loading' }}>
            <VersionsPanel />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/loading versions/i)).toBeInTheDocument();
    },
};

/** Error — the fetch failed; the panel degrades to an error line. */
export const ErrorState: Story = {
    render: () => (
        <MockVersionsProvider config={{ listState: 'error' }}>
            <VersionsPanel />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/could not load version history/i)).toBeInTheDocument();
    },
};

/**
 * View-only — a `disabled` admin (embed.view without embed.update): history is visible, Save is
 * hidden and Restore is disabled.
 */
export const ViewOnly: Story = {
    render: () => (
        <MockVersionsProvider config={{ versions: SAMPLE_VERSIONS }}>
            <VersionsPanel disabled />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByText('v2');
        await expect(canvas.queryByRole('button', { name: /save version/i })).toBeNull();
        expect(canvas.getByRole('button', { name: /Restore v2/i })).toBeDisabled();
    },
};

/**
 * Multi-type — the same panel over a different record's history (only two versions, no labels)
 * proves the component is record-agnostic: nothing about it is composition-specific.
 */
export const MultiType: Story = {
    render: () => (
        <MockVersionsProvider
            config={{
                versions: [
                    { ...SAMPLE_VERSIONS[0], version: 2, readable: 'v2', label: null },
                    { ...SAMPLE_VERSIONS[2], isHead: false },
                ],
            }}
        >
            <VersionsPanel />
        </MockVersionsProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('v2')).toBeInTheDocument();
    },
};
