import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { AuthStoryFrame, setStubPage, setStubForm, DEMO_ACCOUNTS } from '../../story-harness';

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
    withUserPicker = false,
    status,
}: {
    errors?: Record<string, string>;
    forceProcessing?: boolean;
    withDemoAccounts?: boolean;
    withUserPicker?: boolean;
    status?: string;
}) {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({
        canResetPassword: true,
        demoAccounts: withDemoAccounts ? DEMO_ACCOUNTS : [],
        ...(withUserPicker ? { demoUserSearchUrl: DEMO_SEARCH_URL } : {}),
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
    // Framed the way the app renders it: AuthLayout's brand mark, then the entry tree's own heading (ticket 05 item 5).
    return (
        <AuthStoryFrame slug="login">
            <Page />
        </AuthStoryFrame>
    );
}

// S1: the any-user picker's search, stubbed. The story never reaches a server: `fetch` answers this one URL from fixtures.
const DEMO_SEARCH_URL = '/__story/users/demo-search';
const DEMO_USERS = [
    { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.test', url: '#u1' },
    { id: 'u2', name: 'Grace Hopper', email: 'grace@example.test', url: '#u2' },
    { id: 'u3', name: 'Katherine Johnson', email: 'katherine@example.test', url: '#u3' },
];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
    if (url.pathname !== DEMO_SEARCH_URL) return realFetch(input, init);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const users = DEMO_USERS.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q));
    return new Response(JSON.stringify({ data: { users } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const meta = {
    title: 'Inertia/Auth/Login',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <LoginStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByLabelText('Email address')).toBeInTheDocument();
        await expect(canvas.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    },
};

export const WithDemoAccounts: Story = {
    render: () => <LoginStage withDemoAccounts />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('heading', { name: 'Demo sign-in' })).toBeInTheDocument();
        await expect(canvas.queryByRole('button', { name: /sign in as any user/i })).toBeNull();
    },
};

/** S1: a local host with every demo gate open — the roster and the "sign in as any user" typeahead, opened. */
export const WithUserPicker: Story = {
    render: () => <LoginStage withDemoAccounts withUserPicker />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: /sign in as any user/i }));
        await expect(await canvas.findByText('Grace Hopper')).toBeInTheDocument();
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
    // The named state IS the keyboard focus ring on Password; VR otherwise blurs before capture.
    parameters: { vr: { keepFocus: true } },
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
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
