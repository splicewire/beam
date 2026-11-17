import type { ClientCatalog } from '@schemastud/messages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { TransformsProvider } from './provider';
import { RunnerTransformEditor } from './runner-transform-editor';
import { makeTransformsClient } from './story-harness';

// Localization 30 part S3: beam-transforms' editor reads the reader's catalog through the seam, its review note one
// sentence with the grant values as code slots, and is the pre-30 English, byte for byte, without one. The provider
// module is loaded lazily, so at the parent these render English and fail on the Spanish ASSERTIONS.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-transforms::messages.title': { text: 'Transformaciones', sourceLocale: 'es' },
        'splicewire-beam-transforms::messages.runtime_node': { text: 'Node.js (entorno completo)', sourceLocale: 'es' },
        'splicewire-beam-transforms::messages.visibility_platform': { text: 'plataforma', sourceLocale: 'es' },
        'splicewire-beam-transforms::messages.review_required': {
            text: 'Requiere revisión: publicar con :open o :platform pasa por confianza.',
            sourceLocale: 'es',
        },
    },
};

type Provider = ComponentType<{ value: ClientCatalog; children: ReactNode }>;
async function inLocale(catalog: ClientCatalog | null, children: ReactNode): Promise<ReactNode> {
    if (!catalog) return children;
    try {
        const Provider = (await import('@schemastud/messages/react')).MessageProvider as Provider;
        return <Provider value={catalog}>{children}</Provider>;
    } catch {
        return children;
    }
}

async function mount(catalog: ClientCatalog | null) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const client = { ...makeTransformsClient(), list: () => Promise.resolve([]) };
    render(await inLocale(catalog, (
        <QueryClientProvider client={queryClient}>
            <TransformsProvider services={{ client }}>
                <RunnerTransformEditor />
            </TransformsProvider>
        </QueryClientProvider>
    )));
    await waitFor(() => expect(document.querySelector('[data-page-state="empty"]')).not.toBeNull());
    fireEvent.change(document.getElementById('rt-net')!, { target: { value: 'open' } });
}

afterEach(cleanup);

describe('beam-transforms in the reader\'s locale', () => {
    it('titles the page and labels the runtimes in Spanish', async () => {
        await mount(spanish);
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Transformaciones');
        expect(screen.getByRole('option', { name: 'Node.js (entorno completo)' })).toBeDefined();
        // The Sharing option reads the reader's language; its value stays the wire value.
        expect((screen.getByRole('option', { name: 'plataforma' }) as HTMLOptionElement).value).toBe('platform');
    });

    it('renders the review note as one Spanish sentence, the grant values staying code', async () => {
        await mount(spanish);
        const note = screen.getByText((_, node) => node?.tagName === 'P' && (node.textContent ?? '').startsWith('Requiere revisión'));
        expect(note.textContent).toBe('Requiere revisión: publicar con net:open o platform pasa por confianza.');
        expect([...note.querySelectorAll('code')].map((code) => code.textContent)).toEqual(['net:open', 'platform']);
    });

    it('is the pre-30 English without a catalog', async () => {
        await mount(null);
        const note = screen.getByText((_, node) => node?.tagName === 'P' && (node.textContent ?? '').startsWith('Review required'));
        expect(note.textContent).toBe(
            'Review required — net:open and platform publishing are trust-gated (effective grant floors to deny-by-default until approved).',
        );
        expect(note.querySelectorAll('code')).toHaveLength(2);
        expect([...(document.getElementById('rt-visibility') as HTMLSelectElement).options].map((o) => `${o.value}=${o.text}`)).toEqual([
            'private=private',
            'tenant=tenant',
            'platform=platform',
        ]);
    });
});
