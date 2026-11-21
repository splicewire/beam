import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFrameKit, type FrameTransport } from '@schemastud/frame';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import catalog from '../messages.default.json';
import { NotificationBell, type StoredNotification } from '../src';

/*
 * attention-surfaces 11, checkpoint 1: the bell, rendered inside a realm kit over a FAKE transport that records every
 * call. The bell owns no provider (02-1/02-5) and every read and write goes through the kit's transport (48-1).
 */

const READ = { key: 'read', label: 'Mark read', scope: 'record', method: 'POST', url: '/beam/notifications/notifications/{id}/read', input: null };
const READ_ALL = { key: 'read-all', label: 'Mark all read', scope: 'resource', method: 'POST', url: '/beam/notifications/notifications/read-all', input: null };

function row(id: string, minutesAgo: number, unread = true, text = `Notice ${id}`): StoredNotification {
    return { id, text, kind: null, link: `/somewhere/${id}`, unread, createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString() };
}

/** A transport double: rows and the unread figure live here; list, summary and invoke act on them and are recorded. */
function fakeTransport(initial: StoredNotification[]) {
    const state = { rows: [...initial] };
    const calls: string[] = [];
    const unread = () => state.rows.filter((r) => r.unread).length;
    const transport = {
        list: vi.fn(async (resource: string, params: Record<string, string>) => {
            calls.push(`list ${resource} ${JSON.stringify(params)}`);
            const perPage = Number(params.per_page ?? 25);
            return { data: state.rows.slice(0, perPage), perPage, nextCursor: null };
        }),
        summary: vi.fn(async (resource: string) => {
            calls.push(`summary ${resource}`);
            return { key: resource, label: 'Notifications', icon: null, figures: [{ key: 'unread', label: 'Unread', value: unread() }, { key: 'total', label: 'Notifications', value: state.rows.length }], overview: null };
        }),
        invoke: vi.fn(async (action: { key: string }, target: { id?: string | null }) => {
            calls.push(`invoke ${action.key} ${target.id ?? ''}`.trim());
            state.rows = state.rows.map((r) => (action.key === 'read-all' || r.id === target.id ? { ...r, unread: false } : r));
            return { message: null, data: null };
        }),
        getManifest: vi.fn(async () => ({ resources: [], contexts: { notifications: { actions: [READ, READ_ALL] } } })),
    } as unknown as FrameTransport;

    return { transport, calls, state };
}

function renderBell(rows: StoredNotification[], bell: ReactNode = <NotificationBell seeAllHref="/frame/notifications" />) {
    const fake = fakeTransport(rows);
    const kit = createFrameKit({ transport: fake.transport, urlState: 'memory' });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <kit.Provider>{bell}</kit.Provider>
        </QueryClientProvider>,
    );

    return fake;
}

const label = (key: string) => (catalog.messages as Record<string, string>)[`splicewire-beam-notifications::messages.${key}`];

describe('NotificationBell', () => {
    it('shows the decision count as the badge number, and a stored notification never changes it', async () => {
        renderBell([row('a', 1), row('b', 2)], <NotificationBell needsYou={{ count: 3, href: '/review' }} seeAllHref="/frame/notifications" />);

        const bell = await screen.findByRole('button', { name: new RegExp(label('bell_label')) });
        expect(within(bell).getByTestId('bell-count').textContent).toBe('3');
        await waitFor(() => expect(within(bell).getByTestId('bell-unread-dot')).toBeTruthy());
        expect(within(bell).getByTestId('bell-count').textContent).toBe('3');
    });

    it('shows no number without a Needs-you slot, only the unread dot, and no dot when nothing is unread', async () => {
        renderBell([row('a', 1, false)]);

        const bell = await screen.findByRole('button', { name: new RegExp(label('bell_label')) });
        await waitFor(() => expect(bell.getAttribute('data-unread')).toBe('false'));
        expect(within(bell).queryByTestId('bell-count')).toBeNull();
        expect(within(bell).queryByTestId('bell-unread-dot')).toBeNull();
    });

    it('opens one popover: Needs you as the count and one link, then the five newest Recent rows', async () => {
        const fake = renderBell(
            [row('n1', 1), row('n2', 2, false), row('n3', 3), row('n4', 4), row('n5', 5), row('n6', 6)],
            <NotificationBell needsYou={{ count: 2, href: '/review' }} seeAllHref="/frame/notifications" />,
        );
        await userEvent.click(await screen.findByRole('button', { name: new RegExp(label('bell_label')) }));

        const needsYou = await screen.findByRole('region', { name: label('needs_you') });
        expect(within(needsYou).getByRole('link').getAttribute('href')).toBe('/review');
        expect(within(needsYou).queryAllByRole('listitem')).toHaveLength(0);

        const recent = await screen.findByRole('region', { name: label('recent') });
        const items = await within(recent).findAllByRole('listitem');
        expect(items).toHaveLength(5);
        expect(items[0].textContent).toContain('Notice n1');
        expect(within(items[0]).getByRole('link').getAttribute('href')).toBe('/somewhere/n1');
        expect(items[0].getAttribute('data-unread')).toBe('true');
        expect(items[1].getAttribute('data-unread')).toBe('false');
        expect(items[0].querySelector('time')?.getAttribute('datetime')).toBeTruthy();
        expect(fake.calls).toContain('list notifications {"per_page":"5"}');
        expect(within(recent).getByRole('link', { name: label('see_all') }).getAttribute('href')).toBe('/frame/notifications');
    });

    it('leaves Recent out when there are no stored rows, and shows Recent alone when no Needs-you slot is given', async () => {
        renderBell([], <NotificationBell needsYou={{ count: 1, href: '/review' }} seeAllHref="/frame/notifications" />);
        await userEvent.click(await screen.findByRole('button', { name: new RegExp(label('bell_label')) }));
        await screen.findByRole('region', { name: label('needs_you') });
        await waitFor(() => expect(screen.queryByRole('region', { name: label('recent') })).toBeNull());
    });

    it('shows Recent alone with no Needs-you slot', async () => {
        renderBell([row('a', 1)]);
        await userEvent.click(await screen.findByRole('button', { name: new RegExp(label('bell_label')) }));
        await screen.findByRole('region', { name: label('recent') });
        expect(screen.queryByRole('region', { name: label('needs_you') })).toBeNull();
    });

    it('clears the unread dot through the declared actions: mark one read, then mark all read', async () => {
        const fake = renderBell([row('a', 1), row('b', 2)]);
        const bell = await screen.findByRole('button', { name: new RegExp(label('bell_label')) });
        await waitFor(() => expect(bell.getAttribute('data-unread')).toBe('true'));
        await userEvent.click(bell);

        const recent = await screen.findByRole('region', { name: label('recent') });
        const first = (await within(recent).findAllByRole('listitem'))[0];
        await userEvent.click(within(first).getByRole('button', { name: label('mark_read') }));
        await waitFor(() => expect(fake.calls).toContain('invoke read a'));

        await userEvent.click(within(recent).getByRole('button', { name: label('mark_all_read') }));
        await waitFor(() => expect(fake.calls).toContain('invoke read-all'));
        await waitFor(() => expect(bell.getAttribute('data-unread')).toBe('false'));
        expect(within(bell).queryByTestId('bell-unread-dot')).toBeNull();
    });

    it('makes every request through the kit transport: list, summary and the two declared actions, nothing else', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const fake = renderBell([row('a', 1)]);
        await userEvent.click(await screen.findByRole('button', { name: new RegExp(label('bell_label')) }));
        await screen.findByRole('region', { name: label('recent') });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(fake.calls.every((c) => /^(list|summary|invoke) /.test(c))).toBe(true);
        fetchSpy.mockRestore();
    });

    it('declares its client text as explicit keys in its own namespace', () => {
        expect(catalog.namespace).toBe('splicewire-beam-notifications');
        expect(Object.keys(catalog.messages)).toEqual(expect.arrayContaining(
            ['needs_you', 'recent', 'mark_all_read', 'see_all'].map((k) => `splicewire-beam-notifications::messages.${k}`),
        ));
    });
});
