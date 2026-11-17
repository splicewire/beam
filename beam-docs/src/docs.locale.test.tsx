import type { ClientCatalog } from '@schemastud/messages';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocsPublishingPanel } from './DocsPublishingPanel.js';
import { ProductSwitcher } from './ProductSwitcher.js';
import type { DocsTransport } from './publications.js';

// Localization 30 part D1: beam-docs' publishing and chrome copy reads the reader's catalog through the seam, and is the
// pre-30 English, byte for byte, without one. The provider module is loaded lazily, so at the parent (no seam yet) these
// render English and fail on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-docs::messages.publish_heading': { text: 'Publicar una versión', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.request_unreachable': { text: 'No se pudo contactar con el servicio de publicación.', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.switcher_visit': { text: 'Visitar :name', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.switcher_products': { text: 'Productos', sourceLocale: 'es' },
    },
};
const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };

type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
async function messageProvider(): Promise<Provider | null> {
    try {
        return (await import('@schemastud/messages/react')).MessageProvider as Provider;
    } catch {
        return null;
    }
}
async function inLocale(catalog: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={catalog}>{children}</Provider> : children;
}

afterEach(cleanup);

describe('beam-docs copy reads the seam', () => {
    it('keeps a failed request as a key, so a live locale switch re-renders it', async () => {
        // A transport failure that is not one of ours renders our fixed line (never the raw error).
        const transport = vi.fn<DocsTransport>().mockRejectedValue(new Error('socket hang up: secret=abc'));
        const panel = <DocsPublishingPanel transport={transport} />;
        const view = render(await inLocale(spanish, panel));

        expect(screen.queryByRole('heading', { name: 'Publicar una versión' })).not.toBeNull();
        await waitFor(() => expect(screen.queryByText('No se pudo contactar con el servicio de publicación.')).not.toBeNull());
        expect(screen.queryByText(/secret=abc/)).toBeNull();

        view.rerender(await inLocale(english, panel));

        expect(screen.queryByText('Could not reach the publishing service. Check your connection and try again.')).not.toBeNull();
        expect(screen.queryByText('No se pudo contactar con el servicio de publicación.')).toBeNull();
        expect(screen.queryByRole('heading', { name: 'Publish a release' })).not.toBeNull();
    });

    it("names the product switcher's controls in the reader's locale; a product's name stays the server's", async () => {
        const related = [
            { key: 'beam', name: 'Beam', tagline: null, href: '/beam', docs: null },
            { key: 'tower', name: 'Tower', tagline: null, href: '/tower', docs: null },
        ] as never;
        const switcher = <ProductSwitcher related={related} />;
        const view = render(await inLocale(spanish, switcher));

        expect(screen.queryByRole('button', { name: 'Productos' })).not.toBeNull();
        screen.getByRole('button', { name: 'Productos' }).click();
        await waitFor(() => expect(screen.queryByRole('link', { name: 'Visitar Beam' })).not.toBeNull());

        // The same tree in English (a provider swap, not a remount), so the open panel re-renders in place.
        view.rerender(await inLocale(english, switcher));
        expect(screen.queryByRole('link', { name: 'Visit Beam' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Products' })).not.toBeNull();
    });
});
