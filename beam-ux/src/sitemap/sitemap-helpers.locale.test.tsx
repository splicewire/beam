import { createMessages, type ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import catalog from '../../messages.default.json';
import { FIXTURE_PAGES } from './fixtures';
import { issueLabel, SearchStatus } from './parts';

// Localization 31 part E (REVIEW-31A-F: swept with a text search as well as the ratchet): copy a helper or a status
// map returns reads the reader's catalog, and keeps the pre-31 English with no provider.
afterEach(cleanup);
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ux::messages.sitemap_search_listed': { text: 'En la lista', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.sitemap_issue_file_missing_count': { text: ':count archivos faltan', sourceLocale: 'es' },
    },
};
const listed = FIXTURE_PAGES.find((page) => page.search.listed && page.search.reason === 'listed')!;

it('renders a status-map label and a helper-returned issue label in the reader\'s locale', () => {
    const english = render(<SearchStatus page={listed} />);
    expect(screen.getByText('Listed')).toBeTruthy();
    english.unmount();
    expect(issueLabel({ kind: 'file-missing', count: 3 })).toBe('3 files missing');

    render(<MessageProvider value={spanish}><SearchStatus page={listed} /></MessageProvider>);
    expect(screen.getByText('En la lista')).toBeTruthy();
    expect(issueLabel({ kind: 'file-missing', count: 3 }, createMessages(catalog.messages, { catalog: spanish }))).toBe('3 archivos faltan');
});
