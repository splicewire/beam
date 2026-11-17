import type { ClientCatalog } from '@schemastud/messages';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setDocsConfiguration } from './config.js';
import { DataExample } from './DataExample.js';
import type { RegistryIndexData, RegistryRegistrantsData } from './generated/types.js';
import { PhpApiReference } from './PhpApiReference.js';
import type { DocsTransport } from './publications.js';
import { REGISTRY_INDEX_KIND, RegistryIndexNav, type RegistryIndexNavNode } from './RegistryIndexNav.js';
import { RegistryRegistrants } from './RegistryRegistrants.js';
import wire from '../tests/fixtures/php-api-wire.json';

// Localization 30 part D2: the registry panels, the data example and the PHP API reference read the reader's catalog
// through the seam, with the hand-rolled plurals on m.choice, and are the pre-30 English, byte for byte, without one.
// The provider module is loaded lazily, so at the parent these render English and fail on the Spanish ASSERTIONS.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-docs::messages.registrants_heading': { text: 'En este sitio', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.registrants_unattributed': {
            text: '1 entrada no indica quién la registró.|:count entradas no indican quién las registró.',
            sourceLocale: 'es',
        },
        'splicewire-beam-docs::messages.data_example_note': { text: 'Capturado del PHP de al lado.', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.php_filter_placeholder': { text: 'Filtrar :count símbolo|Filtrar :count símbolos', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.php_no_symbol': { text: 'Ningún símbolo publicado se llama :name.', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.registry_overview': { text: 'Vista general', sourceLocale: 'es' },
        'splicewire-beam-docs::messages.registry_other': { text: 'Otros registros', sourceLocale: 'es' },
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

const recording: RegistryRegistrantsData = {
    root: 'beam.particle.resources',
    describedHere: true,
    owner: 'Splicewire\\Beam\\Particle\\ParticleResourceRegistry',
    describedBy: 'splicewire/laravel-beam',
    recordsRegistrants: true,
    entries: [{ key: 'beam.particle.resources.users', registrant: 'splicewire/laravel-beam-accounts' }],
    unattributed: 3,
    note: null,
};
const answering = (value: unknown): DocsTransport => async () => value;

beforeEach(() => setDocsConfiguration({ registryLinkEndpoint: null, registriesEndpoint: '/beam/docs/registries' }));
afterEach(cleanup);

describe('beam-docs D2 copy reads the seam', () => {
    it('counts unattributed entries through the catalog plural, and re-renders on a live locale switch', async () => {
        const panel = <RegistryRegistrants root="beam.particle.resources" transport={answering(recording)} />;
        const view = render(await inLocale(spanish, panel));

        await waitFor(() => expect(screen.queryByRole('heading', { name: 'En este sitio' })).not.toBeNull());
        expect(screen.queryByText('3 entradas no indican quién las registró.')).not.toBeNull();

        view.rerender(await inLocale(english, panel));

        expect(screen.queryByRole('heading', { name: 'On this site' })).not.toBeNull();
        expect(screen.queryByText('3 entries do not name who registered them.')).not.toBeNull();
    });

    it('pluralises the PHP API filter and keeps a code-carrying sentence whole, in the reader\'s locale', async () => {
        const { index } = (wire as { audiences: { public: { index: unknown } } }).audiences.public;
        const transport: DocsTransport = async (url) => {
            if (url.endsWith('/php-api-index')) return { data: index };
            throw new Error('404');
        };
        setDocsConfiguration({ registryLinkEndpoint: null, phpApiEndpoint: '/beam/docs' });
        window.history.replaceState(null, '', '/docs/php?symbol=Nope%5CMissing');
        const reference = <PhpApiReference transport={transport} />;
        const view = render(await inLocale(spanish, reference));

        await waitFor(() => expect(screen.queryByPlaceholderText(/^Filtrar \d+ símbolos$/)).not.toBeNull());
        const status = screen.getByRole('status');
        expect(status.textContent).toBe('Ningún símbolo publicado se llama Nope\\Missing.');
        expect(status.querySelector('code')?.textContent).toBe('Nope\\Missing');

        view.rerender(await inLocale(english, reference));
        expect(screen.queryByPlaceholderText(/^Filter \d+ symbols$/)).not.toBeNull();
        expect(screen.getByRole('status').textContent).toBe('No published symbol is named Nope\\Missing.');
        window.history.replaceState(null, '', '/');
    });

    it("rebuilds the registry index's memoised tree on a live locale switch (its Overview title and track label)", async () => {
        const index: RegistryIndexData = {
            total: 3,
            groups: [
                {
                    key: 'Tower operations', title: 'Tower operations', href: null, roots: [],
                    groups: [{
                        key: 'conduit', title: 'Conduits', href: null, groups: [],
                        roots: [{ root: 'conduit', href: '/docs/registry/conduit', availability: 'served', note: null }],
                    }],
                },
                {
                    key: 'beam.workflows', title: 'Workflow registries', href: '/docs/registries/beam.workflows', groups: [],
                    roots: [{ root: 'workflow', href: '/docs/registries/workflow', availability: 'served', note: null }],
                },
            ],
        } as RegistryIndexData;
        const node: RegistryIndexNavNode = { kind: REGISTRY_INDEX_KIND, title: 'Registry index', href: null, children: [], index };
        // Inside the Workflow group, so its Overview leaf is open; the group sits in the "other" track.
        const nav = <RegistryIndexNav node={node} currentHref="/docs/registries/workflow" />;
        const view = render(await inLocale(spanish, nav));

        await waitFor(() => expect(screen.queryByRole('link', { name: 'Vista general' })).not.toBeNull());
        expect(screen.queryByText('Otros registros')).not.toBeNull();

        view.rerender(await inLocale(english, nav));
        expect(screen.queryByRole('link', { name: 'Overview' })).not.toBeNull();
        expect(screen.queryByText('Other registries')).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Vista general' })).toBeNull();
    });

    it("captions the data example in the reader's locale", async () => {
        const example = (
            <DataExample source="tests/Example.php">
                <pre>{'<?php echo 1;'}</pre>
                <pre>{'1'}</pre>
            </DataExample>
        );
        render(await inLocale(spanish, example));
        expect(screen.queryByText('Capturado del PHP de al lado.')).not.toBeNull();
    });
});
