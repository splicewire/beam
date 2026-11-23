import type { Meta, StoryObj } from '@storybook/react-vite';
import { createFrameKit, type FrameTransport } from '@schemastud/frame';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, userEvent, within } from 'storybook/test';
import type { ComponentType } from 'react';
import type { StoredNotification } from './data';
import { NotificationBell } from './NotificationBell';

/*
 * attention-surfaces 11: the bell in isolation, inside a realm kit over an in-memory transport (no network). The open
 * state is the ticket's Unmeasured question: does a count-only "Needs you" plus five "Recent" rows read as one control?
 */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const ROWS: StoredNotification[] = [
    { id: 'n1', text: "You've hit your reload cap this period.", kind: 'auto_reload_period_ceiling', link: '/settings/auto-reload', unread: true, createdAt: minutesAgo(3) },
    { id: 'n2', text: 'Your intake was received', kind: null, link: '/review/7', unread: true, createdAt: minutesAgo(42) },
    { id: 'n3', text: 'We reloaded your credits ($12.50).', kind: 'auto_reload_succeeded', link: null, unread: false, createdAt: minutesAgo(180) },
    { id: 'n4', text: 'Re-authorize your card to resume auto-reload.', kind: 'auto_reload_disabled', link: '/settings/auto-reload', unread: false, createdAt: minutesAgo(60 * 26) },
    { id: 'n5', text: 'A new member joined the workspace', kind: null, link: null, unread: false, createdAt: minutesAgo(60 * 24 * 4) },
];

function memoryTransport(rows: StoredNotification[]): FrameTransport {
    let state = [...rows];
    const actions = [
        { key: 'read', label: 'Mark read', scope: 'record', method: 'POST', url: '/beam/notifications/notifications/{id}/read', input: null },
        { key: 'read-all', label: 'Mark all read', scope: 'resource', method: 'POST', url: '/beam/notifications/notifications/read-all', input: null },
    ];

    return {
        list: async (_resource: string, params: Record<string, string>) => ({ data: state.slice(0, Number(params.per_page ?? 25)), perPage: Number(params.per_page ?? 25), nextCursor: null }),
        summary: async (resource: string) => ({ key: resource, label: 'Notifications', icon: null, figures: [{ key: 'unread', label: 'Unread', value: state.filter((r) => r.unread).length }], overview: null }),
        invoke: async (action: { key: string }, target: { id?: string | null }) => {
            state = state.map((r) => (action.key === 'read-all' || r.id === target.id ? { ...r, unread: false } : r));
            return { message: null, data: null };
        },
        getManifest: async () => ({ resources: [], contexts: { notifications: { actions } } }),
    } as unknown as FrameTransport;
}

function withKit(rows: StoredNotification[]) {
    return (Story: ComponentType) => {
        const kit = createFrameKit({ transport: memoryTransport(rows), urlState: 'memory' });
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        return (
            <QueryClientProvider client={client}>
                <kit.Provider>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', padding: 16, minHeight: 440 }}>
                        <Story />
                    </div>
                </kit.Provider>
            </QueryClientProvider>
        );
    };
}

const meta: Meta<typeof NotificationBell> = {
    title: 'beam-notifications/NotificationBell',
    component: NotificationBell,
    args: { seeAllHref: '/frame/notifications' },
};
export default meta;
type Story = StoryObj<typeof NotificationBell>;

/** The flagship's bell: Review's count in "Needs you", five recent stored notifications. Opened. */
export const NeedsYouAndRecentOpen: Story = {
    args: { needsYou: { count: 3, href: '/review' } },
    decorators: [withKit(ROWS)],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: /Notifications/ }));
        const body = within(canvasElement.ownerDocument.body);
        await expect(await body.findByRole('region', { name: 'Recent' })).toBeTruthy();
        await expect((await body.findAllByRole('listitem')).length).toBe(5);
    },
};

/** A beam-only site: no "Needs you" slot, so "Recent" alone. Opened. */
export const RecentAloneOpen: Story = {
    decorators: [withKit(ROWS)],
    play: async ({ canvasElement }) => {
        await userEvent.click(await within(canvasElement).findByRole('button', { name: /Notifications/ }));
        await expect(await within(canvasElement.ownerDocument.body).findByRole('region', { name: 'Recent' })).toBeTruthy();
    },
};
