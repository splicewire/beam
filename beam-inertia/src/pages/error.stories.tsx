import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage } from '../story-harness';

/**
 * Error — the packaged `error` page (`splicewire/laravel-beam-accounts`' `ErrorPages` renders it for a
 * browser's 403/404/419/500/503), resolved via `resolveBeamPage` and wrapped by its OWN layout resolver
 * (`ErrorPage.layout(props)`) exactly as Inertia does at runtime: a signed-in viewer gets the account
 * shell, a guest gets the site shell.
 */
type ErrorProps = { status: number; title: string; message: string };
type PageComponent = ComponentType<Record<string, unknown>> & {
    layout?: (props: Record<string, unknown>) => ComponentType<{ children: ReactNode }>;
};

const SIGNED_IN = {
    auth: { user: { id: 1, name: 'Demo Member', email: 'member@example.test' } },
    accountNav: {
        items: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Profile', href: '/settings/profile' },
            { title: 'Plan', href: '/plan' },
        ],
    },
    accountShell: {
        plan: { tier: 'pro', label: 'Pro' },
        profile: { handle: '@demo-member', metrics: [{ label: 'MEMBERS', value: '1' }] },
        account: { email: 'member@example.test' },
        upsells: [],
    },
};

function ErrorStage({ page, props }: { page: ErrorProps; props: Record<string, unknown> }) {
    const [Page, setPage] = useState<PageComponent | null>(null);
    setStubPage({ ...props, ...page });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('error').then((C) => alive && setPage(() => C as PageComponent));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;

    const all = { ...props, ...page };
    const Layout = Page.layout?.(all);
    const body = <Page {...all} />;

    return Layout ? <Layout>{body}</Layout> : body;
}

const meta = {
    title: 'Inertia/Error',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** A member following a link into the operator realm: the policy's own sentence, in the account shell. */
export const Forbidden: Story = {
    render: () => (
        <ErrorStage
            props={SIGNED_IN}
            page={{
                status: 403,
                title: 'You don’t have access to this page',
                message: 'This action is unauthorized.',
            }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Error 403')).toBeInTheDocument();
        await expect(canvas.getByText('This action is unauthorized.')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Go to your dashboard' })).toBeInTheDocument();
    },
};

/** A guest on a page that does not exist: the site shell, and the way home. */
export const NotFound: Story = {
    render: () => (
        <ErrorStage
            props={{ auth: { user: null } }}
            page={{
                status: 404,
                title: 'Page not found',
                message: 'The page you were looking for doesn’t exist or has moved.',
            }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Error 404')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Go to the home page' })).toBeInTheDocument();
    },
};

/** A server error for a signed-in viewer, on a phone. */
export const ServerErrorNarrow: Story = {
    render: () => (
        <ErrorStage
            props={SIGNED_IN}
            page={{
                status: 500,
                title: 'Something went wrong',
                message: 'An unexpected error stopped this page from loading. Please try again in a moment.',
            }}
        />
    ),
    globals: { viewport: { value: 'mobile1', isRotated: false } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Error 500')).toBeInTheDocument();
    },
};
