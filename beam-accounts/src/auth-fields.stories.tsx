import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within, expect } from 'storybook/test';
import { Label } from '@schemastud/ui';
import { AuthError, PasswordInput } from './auth-fields';
import { AuthStage } from './story-harness';

/**
 * Accounts / AuthFields — the two dependency-light auth primitives shared across every
 * form in the package: `PasswordInput` (an Input with a show/hide eye toggle) and
 * `AuthError` (the inline `role=alert` line). Both render entirely against semantic tokens
 * (`text-destructive`, `text-muted-foreground`, the foundation `Input`), so the whole
 * surface re-skins under `.dark` with no self-contained hex — no ticket-32 debt here.
 *
 * Treatment axes (ticket 13): **states** is the exposed axis — PasswordInput has
 * hidden↔visible; AuthError has present↔absent. Ambient token + light⊗dark are inherited
 * from the workbench. No variant/size/tone/density props are exposed → those axes are
 * absent-not-a-gap (rule of sanction).
 */
const meta = {
    title: 'Accounts/AuthFields',
    component: PasswordInput,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage width="max-w-xs">{Story()}</AuthStage>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Field({ initial = '' }: { initial?: string }) {
    const [value, setValue] = useState(initial);
    return (
        <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <PasswordInput id="pw" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
    );
}

/** Default: masked, empty. */
export const Password: Story = { render: () => <Field /> };

/** Filled + masked — dots, eye shows "reveal". */
export const PasswordFilled: Story = { render: () => <Field initial="correct horse battery" /> };

/**
 * Revealed — `play` clicks the eye toggle so VR captures the settled *visible* state, and
 * asserts the aria-pressed flip (the toggle is a real button in the tab order).
 */
export const PasswordRevealed: Story = {
    render: () => <Field initial="correct horse battery" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole('button', { name: /show password/i });
        await userEvent.click(toggle);
        await expect(canvas.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    },
};

/** The inline error line — the `error` state of the form fields. Renders nothing when empty. */
export const Error: StoryObj = {
    render: () => <AuthError message="This reset link is invalid or has expired." />,
};
