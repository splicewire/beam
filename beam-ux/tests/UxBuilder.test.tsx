import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { JsonDoc } from '../src/blockdoc/json';
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

// Entry IDS, not slugs — the transport addresses by id since ADR-0214 §2, and `Region.recordId` is
// what the builder hands the injected client.
const CARD_ID = '0193b1e0-card-0000-0000-000000000002';
const HERO_ID = '0193b1e0-hero-0000-0000-000000000001';

const regions: Region[] = [
    {
        id: 'card',
        label: 'Program card › config',
        kind: 'form',
        recordId: CARD_ID,
        recordLabel: 'program-card',
        note: 'REAL SchemaForm off the loaded schema.',
    },
    {
        id: 'hero',
        label: 'Hero › heading',
        kind: 'richtext',
        recordId: HERO_ID,
        recordLabel: 'page.programs.hero',
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
    id: CARD_ID,
    type: 'form',
    format: 'tsx',
    schema: {
        type: 'object',
        properties: {
            title: { type: 'string', title: 'Card title' },
            ctaLabel: { type: 'string', title: 'CTA label' },
        },
        required: ['title'],
    },
    body: { title: 'Frontend Foundations', ctaLabel: 'Enroll' },
    source: '',
    compileError: null,
    authoredComponents: [],
};

/** An in-memory client that records the last save and resolves the fixture body. */
function makeClient(saveBody: UxBuilderClient['saveBody']): UxBuilderClient {
    return {
        loadBody: (id: string) =>
            Promise.resolve<BeamUxEntryBodyData>(
                id === CARD_ID
                    ? cardBody
                    : {
                        slug: id,
                        id,
                        type: 'richtext',
                        format: 'tsx',
                        schema: null,
                        body: {},
                        source: null,
                        compileError: null,
                        authoredComponents: [],
                    },
            ),
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
        const saveBody = vi.fn<UxBuilderClient['saveBody']>((id, body) =>
            Promise.resolve({ ...cardBody, id, body }),
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
                CARD_ID,
                expect.objectContaining({ title: 'Backend Foundations' }),
            ),
        );
        // Success feedback fires through the injected notify.
        await waitFor(() =>
            expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })),
        );
    });

    it('uses the draft seam when the host supplies it, without calling immediate-publish save-body', async () => {
        const publication = {
            id: CARD_ID,
            draftPending: true,
            publishedVersion: 'published-v1',
            publishedReadable: 'published-v1',
            headVersion: 'draft-v2',
            headReadable: 'draft-v2',
            versions: [],
            compileError: null,
        };
        const saveBody = vi.fn<UxBuilderClient['saveBody']>();
        const listVersions = vi.fn(async (_id: string) => publication);
        const saveDraft = vi.fn(async (
            _id: string,
            _body: Record<string, unknown>,
            _baseVersion: string | null,
            _label?: string,
        ) => publication);
        const notify = vi.fn();
        const Wrapper = withProviders({
            client: {
                ...makeClient(saveBody),
                listVersions,
                saveDraft,
            },
            notify,
        });

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

        const title = await screen.findByLabelText(/Card title/);
        fireEvent.change(title, { target: { value: 'Tenant draft title' } });
        fireEvent.click(screen.getByRole('button', { name: /^Save draft$/ }));

        await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(
            CARD_ID,
            expect.objectContaining({ title: 'Tenant draft title' }),
            'draft-v2',
            expect.any(String),
        ));
        expect(listVersions).toHaveBeenCalledWith(CARD_ID);
        expect(saveBody).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith({ type: 'success', message: 'Draft saved.' });
    });

    it('sends a JsonDoc page body to save-body as an array', async () => {
        const original: JsonDoc = [{
            kind: 'block',
            name: 'h2',
            isComponent: false,
            props: [],
            children: [{ kind: 'text', value: 'Original heading' }],
            dynamic: false,
        }];
        const changed: JsonDoc = [{
            kind: 'block',
            name: 'h2',
            isComponent: false,
            props: [],
            children: [{ kind: 'text', value: 'Saved heading' }],
            dynamic: false,
        }];
        const pageBody: BeamUxEntryBodyData = {
            slug: 'page.programs',
            id: HERO_ID,
            type: 'page',
            format: 'mdx',
            schema: null,
            body: original as unknown as Record<string, unknown>,
            source: null,
            compileError: null,
            authoredComponents: [],
        };
        const saveBody = vi.fn<UxBuilderClient['saveBody']>(async (id, body) => ({
            ...pageBody,
            id,
            body: body as unknown as Record<string, unknown>,
        }));
        const loadBody = vi.fn(async () => pageBody);
        const Wrapper = withProviders({
            client: {
                loadBody,
                saveBody,
            },
            notify: vi.fn(),
        });

        render(
            <UxBuilder
                regions={regions}
                pageTree={pageTree}
                palette={palette}
                initialEngaged="hero"
                editorPlacement="inspector"
            />,
            { wrapper: Wrapper },
        );

        const editor = await screen.findByLabelText('MDX source');
        expect(Array.isArray(pageBody.body)).toBe(true);
        expect(loadBody).toHaveBeenCalledWith(HERO_ID);
        expect(saveBody).not.toHaveBeenCalled();
        await waitFor(() => expect(editor).toHaveProperty('value', 'Original heading'));
        fireEvent.change(editor, { target: { value: 'Saved heading' } });
        fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

        await waitFor(() => expect(saveBody).toHaveBeenCalledWith(HERO_ID, changed));
    });

    it('keeps a JsonDoc page body as an array when the host saves a draft', async () => {
        const original: JsonDoc = [{
            kind: 'block',
            name: 'h2',
            isComponent: false,
            props: [],
            children: [{ kind: 'text', value: 'Published heading' }],
            dynamic: false,
        }];
        const changed: JsonDoc = [{
            kind: 'block',
            name: 'h2',
            isComponent: false,
            props: [],
            children: [{ kind: 'text', value: 'Draft heading' }],
            dynamic: false,
        }];
        const pageBody: BeamUxEntryBodyData = {
            slug: 'page.programs',
            id: HERO_ID,
            type: 'page',
            format: 'mdx',
            schema: null,
            body: original as unknown as Record<string, unknown>,
            source: null,
            compileError: null,
            authoredComponents: [],
        };
        const publication = {
            id: HERO_ID,
            draftPending: true,
            publishedVersion: 'published-v1',
            publishedReadable: 'published-v1',
            headVersion: 'draft-v2',
            headReadable: 'draft-v2',
            versions: [],
            compileError: null,
        };
        const saveBody = vi.fn<UxBuilderClient['saveBody']>();
        const listVersions = vi.fn(async () => publication);
        const saveDraft = vi.fn(async () => publication);
        const Wrapper = withProviders({
            client: { loadBody: async () => pageBody, saveBody, listVersions, saveDraft },
            notify: vi.fn(),
        });

        render(
            <UxBuilder
                regions={regions}
                pageTree={pageTree}
                palette={palette}
                initialEngaged="hero"
                editorPlacement="inspector"
            />,
            { wrapper: Wrapper },
        );

        const editor = await screen.findByLabelText('MDX source');
        await waitFor(() => expect(editor).toHaveProperty('value', 'Published heading'));
        fireEvent.change(editor, { target: { value: 'Draft heading' } });
        fireEvent.click(screen.getByRole('button', { name: /^Save draft$/ }));

        await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(HERO_ID, changed, 'draft-v2', expect.any(String)));
        expect(saveBody).not.toHaveBeenCalled();
    });
});
