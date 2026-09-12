import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage, setStubForm, DEMO_ACCOUNTS } from '../../story-harness';

/**
 * Auth / Login — the packaged `auth/login` Inertia page, resolved through the public
 * `resolveBeamPage('auth/login')` seam (the same resolver a host's `app.tsx` calls), so
 * these stories prove the package's real dist export graph rather than a deep `src` import
 * (G6-BUILT-PACKAGE-PROOF). The page renders exclusively through the Inertia v2 `<Form>`
 * render prop — no `useForm` call site exists in this package — so every state below is
 * driven by the `.storybook/inertia-react.stub.tsx` `<Form>` stub via `setStubForm`.
 */
function LoginStage({
    errors,
    forceProcessing,
    withDemoAccounts = false,
    status,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
    withDemoAccounts?: boolean;
    status?: string;
}) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({
        canResetPassword: true,
        demoAccounts: withDemoAccounts ? DEMO_ACCOUNTS : [],
        status,
    });
    setStubForm({ errors, forceProcessing, outcome: 'success' });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('auth/login').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page />;
}

const meta = {
    title: 'Inertia/Auth/Login',
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-sm">{Story()}</div>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <LoginStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Email address')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    },
};

export const WithDemoAccounts: Story = {
    render: () => <LoginStage withDemoAccounts />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/try a demo account/i)).toBeInTheDocument();
    },
};

export const ValidationErrors: Story = {
    render: () => (
        <LoginStage
            errors={{ email: 'These credentials do not match our records.' }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText('These credentials do not match our records.'),
        ).toBeInTheDocument();
    },
};

/** Processing (submitting) — forced from first render so VR captures the settled in-flight button. */
export const Processing: Story = {
    render: () => <LoginStage forceProcessing />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: /log in/i })).toBeDisabled();
    },
};

/** Keyboard interaction: tab from email into password without a mouse. */
export const KeyboardNavigation: Story = {
    render: () => <LoginStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const email = await canvas.findByLabelText('Email address');
        email.focus();
        await userEvent.keyboard('ada@example.test');
        await userEvent.tab();
        await expect(canvas.getByLabelText('Password')).toHaveFocus();
    },
};

export const NarrowViewport: Story = {
    render: () => <LoginStage />,
    parameters: { viewport: { defaultViewport: 'mobile1' } },
};
