import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { userEvent, within, expect } from 'storybook/test';
import { PrivacyRetentionPage, RetentionProvider, type RetentionClient } from '@splicewire/beam-embed';

/**
 * beam-embed's public surface (its `index.ts` exports exactly `PrivacyRetentionPage` +
 * `RetentionProvider` + types) — the tenant privacy/retention governance console over the
 * DIE-11 embed retention API. Imported here from `@splicewire/beam-embed` (the package's
 * real dist export), never a deep `src` path.
 */
const CHATS = [
    { id: '1', title: 'Support bot', retention_days: 90, corpus_optin: false },
    { id: '2', title: 'Sales assistant', retention_days: 30, corpus_optin: true },
];

function makeClient(overrides: Partial<RetentionClient> = {}): RetentionClient {
    return {
        posture: async () => ({ default_days: 90, chats: CHATS }),
        preview: async () => ({ would_prune: 3 }),
        prune: async () => ({ pruned: 3 }),
        erase: async () => ({ erased: 2 }),
        ...overrides,
    };
}

function Stage({
    canManage = true,
    client = makeClient(),
}: {
    canManage?: boolean;
    client?: RetentionClient;
}) {
    const [cache] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
    return (
        <QueryClientProvider client={cache}>
            <RetentionProvider services={{ client }}>
                <PrivacyRetentionPage canManage={canManage} />
            </RetentionProvider>
        </QueryClientProvider>
    );
}

const meta = {
    title: 'Embed/PrivacyRetentionPage',
    parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <Stage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect((await canvas.findAllByText('Support bot')).length).toBeGreaterThan(0);
    },
};

/** Empty — no published chats yet (every card falls back to its "not yet" copy). */
export const Empty: Story = {
    render: () => <Stage client={makeClient({ posture: async () => ({ default_days: 90, chats: [] }) })} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect((await canvas.findAllByText(/no published chats yet/i)).length).toBeGreaterThan(0);
    },
};

/** Loading — the posture + preview reads never settle. */
export const Loading: Story = {
    render: () => (
        <Stage
            client={makeClient({
                posture: () => new Promise(() => {}),
                preview: () => new Promise(() => {}),
            })}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText(/loading windows/i)).toBeInTheDocument();
    },
};

/** Denied — a non-admin viewer: the destructive actions render disabled with "Admin required.". */
export const Denied: Story = {
    render: () => <Stage canManage={false} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect((await canvas.findAllByText('Admin required.')).length).toBeGreaterThan(0);
        await expect(await canvas.findByRole('button', { name: /prune expired sessions/i })).toBeDisabled();
    },
};

/** Error — the posture read fails. */
export const Error: Story = {
    render: () => (
        <Stage
            client={makeClient({
                posture: async () => {
                    throw new globalThis.Error('Retention windows are unavailable.');
                },
            })}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            (await canvas.findAllByText('Retention windows are unavailable.')).length,
        ).toBeGreaterThan(0);
    },
};

/** Confirmation — a subject-erasure receipt after a completed, irreversible erase. */
export const EraseConfirmation: Story = {
    render: () => <Stage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findAllByText('Support bot');
        await userEvent.type(await canvas.findByLabelText('Visitor ID'), 'vis_123');
        await userEvent.click(canvas.getByRole('button', { name: /erase subject/i }));
        const dialog = within(document.body);
        await userEvent.type(await dialog.findByLabelText(/type.*erase.*to confirm/i), 'ERASE');
        await userEvent.click(dialog.getByRole('button', { name: /erase permanently/i }));
        await expect(await canvas.findByText(/erased/i)).toBeInTheDocument();
        await expect(await canvas.findByText(/cannot be undone/i)).toBeInTheDocument();
    },
};

export const NarrowViewport: Story = {
    render: () => <Stage />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
