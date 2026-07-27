import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Button } from '@schemastud/ui';
import { VersionRestoreDialog } from './version-restore-dialog';
import { SAMPLE_VERSIONS } from './story-harness';
import type { VersionData } from './types';

/**
 * Versioning / VersionRestoreDialog — the confirm-before-restore step (extracted from the composition
 * VersionsDrawer), carrying NO toast dependency: feedback is the caller's concern. `VersionsPanel`
 * drives it; here it is catalogued in isolation.
 *
 * Treatment axes (ADR-0116 §7): the **restore flow** (open → confirm) and the **pending** (in-flight
 * roll-forward) state.
 */
const meta = {
    title: 'Versioning/VersionRestoreDialog',
    component: VersionRestoreDialog,
    parameters: { layout: 'centered' },
} satisfies Meta<typeof VersionRestoreDialog>;

export default meta;
type Story = StoryObj<typeof VersionRestoreDialog<VersionData>>;

const target = SAMPLE_VERSIONS[1]; // v2

/** Open — `play` clicks Restore to reveal the confirm dialog (portalled to the body). */
export const Open: Story = {
    render: function OpenStory() {
        const [version, setVersion] = useState<VersionData | null>(null);
        return (
            <>
                <Button onClick={() => setVersion(target)}>Restore {target.readable}</Button>
                <VersionRestoreDialog
                    version={version}
                    pending={false}
                    onConfirm={() => setVersion(null)}
                    onCancel={() => setVersion(null)}
                />
            </>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /Restore v2/i }));
        const dialog = within(document.body);
        await expect(await dialog.findByText(/Restore v2\?/i)).toBeInTheDocument();
    },
};

/** Pending — the roll-forward is in flight (confirm disabled, spinner). */
export const Pending: Story = {
    args: {
        version: target,
        pending: true,
        onConfirm: () => {},
        onCancel: () => {},
    },
};
