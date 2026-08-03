import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
    UxBuilder,
    UxBuilderProvider,
    type BeamUxEntryBodyData,
    type PaletteItem,
    type Region,
    type TreeNode,
    type UxBuilderClient,
    type UxBuilderServices,
} from '../src/index';

/**
 * The isolation bar (rehome-ui §8a): the whole UX-builder tree mounts off PLAIN generated-DTO fixtures
 * — no Laravel, no app context, no `@/`. The single-instance-React recipe (vitest.config) carries
 * @schemastud/seam's SchemaForm + Radix's portals. If a surface had smuggled an app coupling, importing
 * `../src/index` here would fail to resolve and this file would not even load.
 */

const regions: Region[] = [
    {
        id: 'card',
        label: 'Program card › config',
        kind: 'form',
        record: 'program-card',
        note: 'REAL SchemaForm off the loaded schema.',
    },
    {
        id: 'hero',
        label: 'Hero › heading',
        kind: 'richtext',
        record: 'page.programs.hero',
        note: 'blockdoc preview.',
    },
];

const pageTree: TreeNode = {
    id: 'layout',
    label: 'AppLayout',
    kind: 'layout',
    children: [
        {
            id: 'page',
            label: 'Programs',
            kind: 'page',
            children: [
                { id: 'n-card', label: 'Program card', kind: 'region', regionId: 'card' },
                { id: 'n-hero', label: 'Hero', kind: 'region', regionId: 'hero' },
            ],
        },
    ],
};

const palette: PaletteItem[] = [
    { key: 'form', label: 'Config form', kind: 'form', hint: 'schema-driven SchemaForm' },
];

const cardBody: BeamUxEntryBodyData = {
    slug: 'program-card',
    type: 'form',
    schema: {
        type: 'object',
        properties: {
            title: { type: 'string', title: 'Card title' },
            ctaLabel: { type: 'string', title: 'CTA label' },
        },
        required: ['title'],
    },
    body: { title: 'Frontend Foundations', ctaLabel: 'Enroll' },
};

/** An in-memory client that records the last save and resolves the fixture body. */
function makeClient(saveBody: UxBuilderClient['saveBody']): UxBuilderClient {
    return {
        loadBody: (slug: string) =>
            Promise.resolve(slug === 'program-card' ? cardBody : { slug, type: 'richtext', schema: null, body: {} }),
        saveBody,
    };
}

function withProviders(services: UxBuilderServices) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={qc}>
            <UxBuilderProvider services={services}>{children}</UxBuilderProvider>
        </QueryClientProvider>
    );
}

describe('§8a — @splicewire/beam-ux UxBuilder mounts off pure DTO fixtures (no Laravel)', () => {
    it('renders the engaged region and routes an edit→save through the injected client', async () => {
        const saveBody = vi.fn<UxBuilderClient['saveBody']>((slug, body) =>
            Promise.resolve({ ...cardBody, slug, body }),
        );
        const notify = vi.fn();
        const Wrapper = withProviders({ client: makeClient(saveBody), notify });

        render(
            <UxBuilder
                regions={regions}
                pageTree={pageTree}
                palette={palette}
                initialEngaged="card"
                editorPlacement="inspector"
            />,
            { wrapper: Wrapper },
        );

        // The engaged region's label renders (canvas + docked inspector both show it).
        await waitFor(() => expect(screen.getAllByText(/Program card/).length).toBeGreaterThan(0));

        // The form region loads its schema → the real SchemaForm renders the title field.
        const title = await screen.findByLabelText(/Card title/);
        // Edit the field, then save through the injected client.
        fireEvent.change(title, { target: { value: 'Backend Foundations' } });
        fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

        await waitFor(() =>
            expect(saveBody).toHaveBeenCalledWith(
                'program-card',
                expect.objectContaining({ title: 'Backend Foundations' }),
            ),
        );
        // Success feedback fires through the injected notify.
        await waitFor(() =>
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })),
        );
    });
});
