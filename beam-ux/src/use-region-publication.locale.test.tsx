import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UxBuilder } from './UxBuilder';
import { UxBuilderProvider } from './provider';
import type { BeamUxEntryBodyData, EntryPublicationState, UxBuilderClient } from './types';

// REVIEW-31D: a notice kept in state is a catalog line plus its data, translated when it renders, so a live locale
// switch re-renders a notice that is already showing (a stored, already-translated string would stay in English).
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

const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: { 'splicewire-beam-ux::messages.publication_draft_saved': { text: 'Borrador guardado.', sourceLocale: 'es' } },
};

describe('a region publication notice under a live locale switch', () => {
    it('re-renders the notice already showing in the new locale', async () => {
        const client: UxBuilderClient = {
            loadBody: vi.fn(async () => ({ id: 'entry-1', body: { content: '# Original' }, schema: null }) as unknown as BeamUxEntryBodyData),
            saveBody: vi.fn(),
            listVersions: vi.fn(async () => publication),
            saveDraft: vi.fn(async () => ({ ...publication, headVersion: 'v2', draftPending: true })),
            publish: vi.fn(async () => publication),
            restoreVersion: vi.fn(async () => publication),
        };
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
        const tree = (catalog: ClientCatalog) => (
            <MessageProvider value={catalog}>
                <QueryClientProvider client={queryClient}>
                    <UxBuilderProvider services={{ client, notify: vi.fn() }}>
                        <UxBuilder
                            regions={[{ id: 'body', label: 'Body', kind: 'richtext', recordId: 'entry-1', note: 'page · site' }]}
                            pageTree={{ id: 'page', label: 'Page', kind: 'page', children: [] }}
                            palette={[]}
                        />
                    </UxBuilderProvider>
                </QueryClientProvider>
            </MessageProvider>
        );
        const view = render(tree(english));

        fireEvent.change(await screen.findByLabelText('MDX source'), { target: { value: '# Draft' } });
        await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
        await waitFor(() => expect(screen.getByText('Draft saved.')).toBeTruthy());

        view.rerender(tree(spanish));

        expect(screen.getByText('Borrador guardado.')).toBeTruthy();
        expect(screen.queryByText('Draft saved.')).toBeNull();
    });
});
