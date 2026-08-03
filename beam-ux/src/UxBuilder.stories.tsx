import type { Meta, StoryObj } from '@storybook/react-vite';
import { UxBuilder } from './UxBuilder';
import { MockUxBuilderProvider } from './story-harness';
import { palette, pageTree, regions } from './story-fixtures';

/**
 * Catalog story for {@link UxBuilder} (rehome-ui; beamux ticket 08). The in-app UX-builder root — in-app
 * visual editing of the beam site's OWN front-end. Its axis is **mode**: overlay (live canvas + a docked
 * inspector, kind-driven) vs. structure (the layout›template›page composition tree + palette). Load/save
 * routes through the package's react-query hooks over the mocked transport client.
 */
const meta = {
    title: 'BeamUx/UxBuilder',
    component: UxBuilder,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story) => (
            <MockUxBuilderProvider>
                <div className="p-6">
                    <Story />
                </div>
            </MockUxBuilderProvider>
        ),
    ],
} satisfies Meta<typeof UxBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** OVERLAY mode, inspector placement — the live region canvas with a docked right-hand editor. */
export const OverlayMode: Story = {
    args: {
        regions,
        pageTree,
        palette,
        initialMode: 'overlay',
        editorPlacement: 'inspector',
        initialEngaged: 'card',
    },
};

/** STRUCTURE mode — the composition tree + placement config + component palette. */
export const StructureMode: Story = {
    args: {
        regions,
        pageTree,
        palette,
        initialMode: 'structure',
    },
};
