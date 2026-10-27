import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UxBuilder } from './UxBuilder';
import { UxBuilderProvider } from './provider';
import type { BeamUxEntryBodyData, EntryPublicationState, UxBuilderClient } from './types';

const publication: EntryPublicationState = {
    id: 'entry-1',
    headVersion: 'v1',
    publishedVersion: 'v1',
    headReadable: 'v1',
    publishedReadable: 'v1',
    draftPending: false,
    versions: [],
    compileError: null,
};

function mount(client: UxBuilderClient, notify = vi.fn()) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <UxBuilderProvider services={{ client, notify }}>
                <UxBuilder
                    regions={[{
                        id: 'body',
                        label: 'Body',
                        kind: 'richtext',
                        recordId: 'entry-1',
                        note: 'page · site',
                    }]}
                    pageTree={{ id: 'page', label: 'Page', kind: 'page', children: [] }}
                    palette={[]}
                />
            </UxBuilderProvider>
        </QueryClientProvider>,
    );
    return { notify };
}

function client(overrides: Partial<UxBuilderClient> = {}): UxBuilderClient {
    return {
        loadBody: vi.fn(async () => ({
            id: 'entry-1',
            body: { content: '# Original' },
            schema: null,
        } as unknown as BeamUxEntryBodyData)),
        saveBody: vi.fn(async (_id, body) => ({ id: 'entry-1', body } as unknown as BeamUxEntryBodyData)),
        ...overrides,
    };
}

describe('UX builder publication-aware save', () => {
    it('saves through the draft capability and labels the action for tenant authoring', async () => {
        const saveBody = vi.fn();
        const saveDraft = vi.fn(async () => ({ ...publication, headVersion: 'v2', draftPending: true }));
        const notify = vi.fn();
        mount(client({
            saveBody,
            listVersions: vi.fn(async () => publication),
            saveDraft,
        }), notify);

        const source = await screen.findByLabelText('MDX source');
        fireEvent.change(source, { target: { value: '# Tenant draft' } });

        await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
        await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(
            'entry-1',
            { content: '# Tenant draft' },
            'v1',
            'UX builder draft',
        ));
        expect(saveBody).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith({ type: 'success', message: 'Draft saved.' });
    });

    it('keeps the central Save action on the immediate save-body path', async () => {
        const saveBody = vi.fn(async (_id, body) => ({ id: 'entry-1', body } as unknown as BeamUxEntryBodyData));
        const saveDraft = vi.fn();
        const notify = vi.fn();
        mount(client({ saveBody, saveDraft, listVersions: undefined }), notify);

        const source = await screen.findByLabelText('MDX source');
        fireEvent.change(source, { target: { value: '# Central save' } });

        expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(saveBody).toHaveBeenCalledWith('entry-1', { content: '# Central save' }));
        expect(saveDraft).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith({ type: 'success', message: 'Saved.' });
    });
});
