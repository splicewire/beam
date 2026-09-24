import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button as FoundationButton } from '@schemastud/ui';
import { expect, within } from 'storybook/test';
import { Button } from './button';

/**
 * Inertia/UI/Button — the disabled treatment across the variants that carry their own, for BOTH copies
 * a beam page renders: this package's shadcn Button (settings, auth, the site) and `@schemastud/ui`'s
 * (every beam-* capability surface). A disabled default and secondary take a foreground tint, a disabled
 * outline keeps its frame as a faint foreground hairline, each with a dimmed label; enabled neighbours
 * show what they are disabled FROM. Ambient light and dark.
 */
function Row({ label, ButtonComponent }: { label: string; ButtonComponent: typeof Button }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="w-28 text-xs text-muted-foreground">{label}</span>
            <ButtonComponent disabled>Save</ButtonComponent>
            <ButtonComponent variant="secondary" disabled>
                Save draft
            </ButtonComponent>
            <ButtonComponent variant="outline" disabled>
                Recheck
            </ButtonComponent>
            <ButtonComponent variant="outline">Cancel</ButtonComponent>
        </div>
    );
}

const meta = {
    title: 'Inertia/UI/Button',
    parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const DisabledVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <Row label="beam-inertia" ButtonComponent={Button} />
            <Row label="@schemastud/ui" ButtonComponent={FoundationButton as typeof Button} />
            <div className="rounded-lg border bg-card p-4">
                <Row label="on a card" ButtonComponent={FoundationButton as typeof Button} />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const outlines = within(canvasElement).getAllByRole('button', { name: 'Recheck' });
        for (const outline of outlines) {
            await expect(outline).toBeDisabled();
            await expect(getComputedStyle(outline).opacity).toBe('1');
        }
    },
};
