import type { ClientCatalog } from '@schemastud/messages';
import type { WorkflowBlueprintData, WorkflowVersionData } from '@splicewire/beam-resources/types/workflows';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { WorkflowsProvider } from './provider';
import type { WorkflowsClient } from './types';
import { WorkflowsAdminPage } from './WorkflowsAdminPage';

// Localization 30 part W3: the workflows admin page reads the reader's catalog through the seam (its coverage plural on
// m.choice), and is the pre-30 English, byte for byte, without one. The provider module is loaded lazily, so at the
// parent this renders English and fails on the Spanish ASSERTIONS rather than on an import.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-workflows::messages.admin_title': { text: 'Flujos de trabajo', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.admin_scope_custom': { text: 'propios', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.admin_coverage_governing': {
            text: 'Gobierna :count registro.|Gobierna :count registros.',
            sourceLocale: 'es',
        },
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

const blueprint: WorkflowBlueprintData = {
    name: 'publish-flow', places: ['draft', 'published'], initial: ['draft'], metadata: null,
    transitions: [{ name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null, reason: null }],
};
const version: WorkflowVersionData = { id: 'v1', version: 1, isActive: true, blueprint };

beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});
afterEach(cleanup);

describe('beam-workflows W3 copy reads the seam', () => {
    it("renders the admin page in the reader's locale, the coverage count on the catalog plural, and re-renders on a switch", async () => {
        const nope = () => Promise.reject(new Error('not in this fixture'));
        const client = {
            listLineages: () => Promise.resolve([{ key: 'publish-flow', name: 'Publish flow', isSystem: false, boundTypes: [], versions: [version] }]),
            catalog: () => Promise.resolve({ blueprintSchema: {}, guards: [], effects: [], types: [], principals: [], canAuthor: true }),
            coverage: () => Promise.resolve({ lineageKey: 'publish-flow', total: 3, versions: [] }),
            saveVersion: nope, bind: nope, unbind: () => Promise.resolve(), migrate: nope,
            projection: () => Promise.resolve(null), transition: nope,
        } as unknown as WorkflowsClient;
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const Provider = await messageProvider();
        const tree = (catalog: ClientCatalog) => {
            const page = (
                <QueryClientProvider client={qc}>
                    <WorkflowsProvider services={{ client, notify: vi.fn() }}>
                        <WorkflowsAdminPage />
                    </WorkflowsProvider>
                </QueryClientProvider>
            );
            return Provider ? <Provider value={catalog}>{page}</Provider> : page;
        };
        const view = render(tree(spanish));

        expect(screen.queryByRole('heading', { name: 'Flujos de trabajo' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'propios' })).not.toBeNull();
        await waitFor(() => expect(screen.queryByText('Publish flow')).not.toBeNull());
        fireEvent.click(screen.getByText('Publish flow'));
        await waitFor(() => expect(screen.queryByText('Gobierna 3 registros.')).not.toBeNull());

        view.rerender(tree(english));
        expect(screen.queryByRole('heading', { name: 'Workflows' })).not.toBeNull();
        expect(screen.queryByText('Governing 3 records (pinned on first transition).')).not.toBeNull();
    });
});
