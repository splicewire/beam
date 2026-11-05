import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { CanvasWidget } from './CanvasWidget.js';
import { CanvasProvider } from './context.js';
import type { CanvasConfig } from './context.js';
import { veCss } from './css.js';

const config: CanvasConfig = { registry: {} };

const meta = {
    title: 'BeamUx/Canvas/NarrowLayout',
    parameters: {
        layout: 'fullscreen',
        viewport: { defaultViewport: 'mobile1' },
        vr: { disable: true },
    },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flex host models the narrow FiveRegion canvas slot next to its fixed navigation rail. */
export const ShrinkableFlexHost: Story = {
    render: () => (
        <>
            <style>{veCss()}</style>
            <main data-testid="narrow-host" style={{ width: 390, maxWidth: '100%' }}>
                <div style={{ display: 'flex', width: '100%', minWidth: 0 }}>
                    <aside aria-hidden="true" style={{ flex: '0 0 180px' }} />
                    <section
                        aria-label="Canvas region"
                        style={{ display: 'flex', flex: '1 1 auto', minWidth: 0 }}
                    >
                        <CanvasProvider config={config}>
                            <CanvasWidget value={[]} />
                        </CanvasProvider>
                    </section>
                </div>
            </main>
        </>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const host = canvas.getByTestId('narrow-host');
        const widget = canvasElement.querySelector<HTMLElement>('.ve-canvas-widget');
        const editorCanvas = canvasElement.querySelector<HTMLElement>('.ve-canvas');

        await expect(host.getBoundingClientRect().width).toBe(390);
        await expect(widget).not.toBeNull();
        await expect(editorCanvas).not.toBeNull();
        await expect(widget!.getBoundingClientRect().width).toBeGreaterThan(0);
        await expect(editorCanvas!.getBoundingClientRect().width).toBeGreaterThan(0);
    },
};
