import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MediaPicker, type EntryImageLibrary } from './MediaPicker';

// Localization 31 part F (the REVIEW-31D class): the picker's load failure is kept as a catalog line and translated
// when it renders, so a live locale switch re-renders the alert already showing.
afterEach(cleanup);
const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: { 'splicewire-beam-ux::messages.editor_images_load_failed': { text: 'No se pudieron leer las imágenes de esta entrada.', sourceLocale: 'es' } },
};

it('re-renders the image-library load failure already showing in the new locale', async () => {
    // A non-Error rejection: the picker shows its own catalog line rather than a raw message.
    const library: EntryImageLibrary = { list: vi.fn().mockRejectedValue('offline'), upload: vi.fn() };
    const tree = (catalog: ClientCatalog) => (
        <MessageProvider value={catalog}>
            <MediaPicker label="Hero" library={library} onChoose={() => {}} />
        </MessageProvider>
    );
    const view = render(tree(english));
    fireEvent.click(screen.getByRole('button', { name: 'Choose image for Hero' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Could not read this entry’s images.');

    view.rerender(tree(spanish));

    expect(screen.getByRole('alert').textContent).toBe('No se pudieron leer las imágenes de esta entrada.');
});
