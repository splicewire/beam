import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FilesComparisonPanel } from './FilesComparisonPanel';
import type { UxBuilderClient } from './types';

// Localization 31 fix-forward (REVIEW-31A-F re-sweep of landed parts): a thrown helper line that the ratchet cannot
// see renders the reader's catalog, and re-renders in the new locale after a live switch.
afterEach(cleanup);
const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: { 'splicewire-beam-ux::messages.files_inspection_unavailable': { text: 'La inspección de archivos no está disponible en este host.', sourceLocale: 'es' } },
};

it('re-renders the inspection-unavailable failure in the new locale', async () => {
    const client = { loadBody: vi.fn(), saveBody: vi.fn() } as unknown as UxBuilderClient;
    const tree = (catalog: ClientCatalog) => (
        <MessageProvider value={catalog}>
            <FilesComparisonPanel memberId="member" client={client} />
        </MessageProvider>
    );
    const view = render(tree(english));
    expect((await screen.findByRole('alert')).textContent).toContain('File inspection is unavailable in this host.');

    view.rerender(tree(spanish));

    expect(screen.getByRole('alert').textContent).toContain('La inspección de archivos no está disponible en este host.');
});
