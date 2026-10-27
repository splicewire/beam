import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { UxBuilder } from './UxBuilder';
import { UxBuilderProvider } from './provider';
import type { UxBuilderClient } from './types';
import type { ReleaseRecord } from './releases';

function release(id: string, status: string, entryId: string): ReleaseRecord {
    return {
        id,
        title: id,
        realm: 'site',
        status,
        reviewedBy: null,
        members: [
            {
                entryId,
                versionId: 'v1',
                observedPin: null,
                redirectTarget: null,
                stale: false,
            },
        ],
        workflow: null,
        canSchedule: false,
        reviewRequired: false,
        previewHref: `/served/${id}`,
    };
}
function mount(listReleases?: UxBuilderClient['listReleases']) {
    const client: UxBuilderClient = {
        loadBody: vi.fn(async () => ({
            id: 'entry-a',
            body: { content: 'Actual saved excerpt' },
            schema: null,
        })),
        saveBody: vi.fn(),
        listReleases,
    };
    render(
        <QueryClientProvider
            client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
            <UxBuilderProvider services={{ client }}>
                <UxBuilder
                    regions={[
                        {
                            id: 'body',
                            label: 'About',
                            kind: 'richtext',
                            recordId: 'entry-a',
                            url: '/about',
                            note: '',
                        },
                    ]}
                    pageTree={{ id: 'page', label: 'Page', kind: 'page', children: [] }}
                    palette={[]}
                />
            </UxBuilderProvider>
        </QueryClientProvider>
    );
}
it('shows every open member Release using its served href, excluding closed and unrelated releases', async () => {
    mount(
        vi.fn(async () => [
            release('Launch', 'draft', 'entry-a'),
            release('Review', 'approved', 'entry-a'),
            release('Closed', 'published', 'entry-a'),
            release('Other', 'draft', 'entry-b'),
        ])
    );
    expect((await screen.findByRole('link', { name: 'Preview Launch' })).getAttribute('href')).toBe(
        '/served/Launch'
    );
    expect(screen.getByRole('link', { name: 'Preview Review' }).getAttribute('href')).toBe(
        '/served/Review'
    );
    expect(screen.queryByRole('link', { name: 'Preview Closed' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Preview Other' })).toBeNull();
});
it('says no open Release only after a successful empty read', async () => {
    mount(vi.fn(async () => []));
    expect(await screen.findByText('No open Release')).toBeTruthy();
});
it('keeps missing and refused client capabilities explicitly unavailable', async () => {
    mount(
        vi.fn(async () => {
            throw new Error('403');
        })
    );
    expect(await screen.findByText('Preview unavailable')).toBeTruthy();
    expect(screen.queryByText('No open Release')).toBeNull();
});

it('does not claim an empty list on hosts without the release port', async () => {
    mount();
    expect(await screen.findByText('Preview unavailable')).toBeTruthy();
    expect(screen.queryByText('No open Release')).toBeNull();
});

it('loads the engaged saved body and does not carry it across entry selection', async () => {
    let resolveSecond:
        | ((body: { id: string; body: { content: string }; schema: null }) => void)
        | undefined;
    const loadBody = vi.fn((id: string) =>
        id === 'entry-a'
            ? Promise.resolve({
                  id,
                  body: { content: 'First saved body' },
                  schema: null,
              })
            : new Promise<{ id: string; body: { content: string }; schema: null }>((resolve) => {
                  resolveSecond = resolve;
              })
    );
    const client: UxBuilderClient = { loadBody, saveBody: vi.fn() };
    render(
        <QueryClientProvider
            client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
            <UxBuilderProvider services={{ client }}>
                <UxBuilder
                    regions={[
                        {
                            id: 'first',
                            label: 'First region',
                            kind: 'richtext',
                            recordId: 'entry-a',
                            note: '',
                        },
                        {
                            id: 'second',
                            label: 'Second region',
                            kind: 'richtext',
                            recordId: 'entry-b',
                            note: '',
                        },
                    ]}
                    pageTree={{ id: 'page', label: 'Page', kind: 'page', children: [] }}
                    palette={[]}
                />
            </UxBuilderProvider>
        </QueryClientProvider>
    );
    expect(await screen.findByText('First saved body', { selector: 'p' })).toBeTruthy();
    expect(loadBody).toHaveBeenCalledTimes(1);
    fireEvent.click(
        screen.getByRole('button', {
            name: /Engage to preview the saved body.*second/,
        })
    );
    expect(screen.queryByText('First saved body', { selector: 'p' })).toBeNull();
    expect(screen.getByText('Loading saved body…')).toBeTruthy();
    await waitFor(() => expect(resolveSecond).toBeDefined());
    resolveSecond?.({
        id: 'entry-b',
        body: { content: 'Second saved body' },
        schema: null,
    });
    expect(await screen.findByText('Second saved body', { selector: 'p' })).toBeTruthy();
    expect(loadBody).toHaveBeenCalledTimes(2);
});
