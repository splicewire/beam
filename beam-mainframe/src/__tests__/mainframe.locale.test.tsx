import type { ClientCatalog } from '@schemastud/messages';
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultRibbon } from '../host';

// Localization 30 part S2: the default frame ribbon reads the reader's catalog through the seam (it is a render
// function the host calls, so it renders a component that does), and is the pre-30 English, byte for byte, without
// one. The provider module is loaded lazily, so at the parent these render English and fail on the ASSERTIONS.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-mainframe::messages.mode_page': { text: 'página', sourceLocale: 'es' },
        'splicewire-beam-mainframe::messages.entry_bound': { text: 'entrada enlazada ✓', sourceLocale: 'es' },
        'splicewire-beam-mainframe::messages.edit_page': { text: 'Editar página', sourceLocale: 'es' },
        'splicewire-beam-mainframe::messages.exit': { text: 'Salir', sourceLocale: 'es' },
    },
};
type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
let provider: Provider | null | undefined;
async function messageProvider(): Promise<Provider | null> {
    if (provider !== undefined) return provider;
    try {
        provider = (await import('@schemastud/messages/react')).MessageProvider as Provider;
    } catch {
        provider = null;
    }
    return provider;
}
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={catalog}>{children}</Provider> : children;
}

afterEach(cleanup);
const noop = () => {};
const ref = { slug: 'home', id: 'e1' } as never;

describe('the default ribbon in the reader\'s locale', () => {
    it('renders the page ribbon in Spanish, the entry label passing through', async () => {
        render(await inLocale(spanish, defaultRibbon({ mode: 'domain', entryRef: ref, entryBound: true, onEdit: noop, onExit: noop })));
        expect(screen.getByText('página · home')).toBeDefined();
        expect(screen.getByText('entrada enlazada ✓')).toBeDefined();
        expect(screen.getByRole('button').textContent).toBe('Editar página');
    });

    it('renders the editing ribbon\'s exit in Spanish', async () => {
        render(await inLocale(spanish, defaultRibbon({ mode: 'window', entryRef: ref, entryBound: true, onEdit: noop, onExit: noop })));
        expect(screen.getByRole('button').textContent).toBe('Salir');
    });

    it('is the pre-30 English without a catalog', () => {
        const { container } = render(<>{defaultRibbon({ mode: 'domain', entryRef: ref, entryBound: false, onEdit: noop, onExit: noop })}</>);
        expect(container.textContent).toBe('beam-uxpage · homeentry …');
    });
});
