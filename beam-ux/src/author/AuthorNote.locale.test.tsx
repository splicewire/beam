import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AuthorNote } from './AuthorNote';

// Localization 31 ruling (coord-lead@calcucrypt 11-17 04:30Z): a shared development build is read by people who are
// not its authors, so the author-note title is copy. It reads the reader's catalog; without a provider it stays the
// pre-31 English.
afterEach(cleanup);
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: { 'splicewire-beam-ux::messages.author_note_title': { text: 'Nota de autor (solo compilaciones de desarrollo)', sourceLocale: 'es' } },
};

it('titles the author note in the reader\'s locale, and in the pre-31 English without one', () => {
    const english = render(<AuthorNote>POST /embeds</AuthorNote>);
    expect(english.container.querySelector('[data-author-note]')?.getAttribute('title')).toBe('Author note (development builds only)');
    english.unmount();

    const view = render(<MessageProvider value={spanish}><AuthorNote>POST /embeds</AuthorNote></MessageProvider>);
    expect(view.container.querySelector('[data-author-note]')?.getAttribute('title')).toBe('Nota de autor (solo compilaciones de desarrollo)');
});
