import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RegionEditorBody } from './RegionEditorBody';

// Localization 31 follow-up (frame-foundation 65's widened census found them as mapped literals): the list preview's
// format badges read the reader's catalog, and keep the pre-31 English without a provider.
afterEach(cleanup);
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ux::messages.region_format_cohort': { text: 'cohorte', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.region_format_self_paced': { text: 'a tu ritmo', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.region_format_live': { text: 'en vivo', sourceLocale: 'es' },
    },
};
const list = () => (
    <RegionEditorBody region={{ id: 'body', label: 'Programs', kind: 'list', recordId: 'e1', note: 'page · site' }} schema={null} body={{}} onChange={vi.fn()} onSave={vi.fn()} />
);

it('renders the list preview\'s format badges in the reader\'s locale, and in the pre-31 English without one', () => {
    const english = render(list());
    for (const word of ['cohort', 'self-paced', 'live']) expect(screen.getByText(word)).toBeTruthy();
    english.unmount();

    render(<MessageProvider value={spanish}>{list()}</MessageProvider>);
    for (const word of ['cohorte', 'a tu ritmo', 'en vivo']) expect(screen.getByText(word)).toBeTruthy();
});
