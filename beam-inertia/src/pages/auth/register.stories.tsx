import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { AuthStoryFrame, setStubPage, setStubForm } from '../../story-harness';

/** Auth / Register — resolved via the public `resolveBeamPage` seam (G6-BUILT-PACKAGE-PROOF). */
function RegisterStage({
    errors,
    forceProcessing,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
}) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({ passwordRules: { minLength: 8 } });
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/register').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    // Framed the way the app renders it: AuthLayout's brand mark, then the entry tree's own heading (ticket 05 item 5).
    return (
        <AuthStoryFrame slug="register">
            <Page />
        </AuthStoryFrame>
    );
}

const meta = {
    title: 'Inertia/Auth/Register',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <RegisterStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Name')).toBeInTheDocument();
        await expect(canvas.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => (
        <RegisterStage
            errors={{
                email: 'The email has already been taken.',
                password: 'The password confirmation does not match.',
            }}
        />
    ),
    // The real page keeps what was typed: `<Form>` submits through router.post, which preserves the page's state on a
    // 422, and `resetOnError` is off, so its uncontrolled inputs survive the error. The story used to render the error
    // over an EMPTY form, which read as the page dropping old input (launch ticket 05 item 6). It types first, as a
    // user would have, so the shot shows the error beside the kept values.
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(await canvas.findByLabelText('Name'), 'Ada Lovelace');
        await userEvent.type(canvas.getByLabelText('Email address'), 'ada@example.test');
        await expect(canvas.getByText('The email has already been taken.')).toBeInTheDocument();
        await expect(canvas.getByLabelText('Email address')).toHaveValue('ada@example.test');
    },
};

export const Processing: Story = {
    render: () => <RegisterStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: /create account/i })).toBeDisabled();
    },
};

export const NarrowViewport: Story = {
    render: () => <RegisterStage />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
