import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type {
    WorkflowBlueprintData,
    WorkflowCatalogData,
    WorkflowLineageData,
    WorkflowVersionData,
    PrincipalKindData,
} from '@splicewire/_resources/types/workflows';
import {
    RecipientPicker,
    WorkflowActions,
    WorkflowDiff,
    WorkflowEditor,
    WorkflowGraph,
    WorkflowMigrate,
    WorkflowsAdminPage,
    WorkflowsProvider,
    type MigrateInput,
    type WorkflowsClient,
    type WorkflowsServices,
} from '../src/index';

/**
 * The isolation bar (rehome-components §8a): the read-only leaves render off PLAIN generated-DTO
 * fixtures — no Laravel, no app context, no `@/`. The single-instance-React recipe (vitest.config)
 * carries xyflow's + Radix's portals. If a leaf had smuggled an app coupling, importing
 * `../src/index` here would fail to resolve and this file would not even load.
 */

// xyflow measures its container via ResizeObserver; jsdom lacks it. Portable test-only polyfill.
beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});

const blueprint = (over: Partial<WorkflowBlueprintData> = {}): WorkflowBlueprintData => ({
    name: 'publish-flow',
    places: ['draft', 'published'],
    initial: ['draft'],
    transitions: [
        { name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null },
    ],
    metadata: null,
    ...over,
});

describe('@splicewire/beam-workflows read-only leaves mount in isolation', () => {
    it('WorkflowGraph lays out places off a blueprint DTO (xyflow, no Laravel)', () => {
        const { container } = render(<WorkflowGraph blueprint={blueprint()} />);
        // xyflow renders each place as a node carrying its label.
        expect(screen.getByText('draft')).toBeDefined();
        expect(screen.getByText('published')).toBeDefined();
        expect(container.querySelector('.react-flow')).not.toBeNull();
    });

    it('RecipientPicker renders selection chips off the principals vocabulary', () => {
        const kinds: PrincipalKindData[] = [
            { kind: 'owner', label: 'Owner', options: null },
            { kind: 'role', label: 'Role', options: [{ value: 'Admin', label: 'Admin' }] },
        ];
        render(
            <RecipientPicker label="Recipients" value={['owner:']} kinds={kinds} onChange={() => {}} />,
        );
        expect(screen.getByText('Recipients')).toBeDefined();
        // The selected `owner:` token resolves to its known chip label.
        expect(screen.getByText('Owner')).toBeDefined();
    });

    it('WorkflowDiff structurally diffs two version DTOs', () => {
        const versions: WorkflowVersionData[] = [
            { id: 'v1', version: 1, isActive: false, blueprint: blueprint({ places: ['draft'], transitions: [] }) },
            { id: 'v2', version: 2, isActive: true, blueprint: blueprint() },
        ];
        render(<WorkflowDiff versions={versions} lineageKey="publish-flow" />);
        expect(screen.getByText('Compare')).toBeDefined();
        // v1 → v2 adds the `published` place; the diff surfaces it (added-place line + route text).
        expect(screen.getAllByText(/published/).length).toBeGreaterThan(0);
    });
});

/** A no-op client whose `migrate` records the last input and resolves a clean dry-run report. */
function fakeClient(migrate: WorkflowsClient['migrate']): WorkflowsClient {
    const nope = () => Promise.reject(new Error('not implemented in fixture'));
    return {
        listLineages: () => Promise.resolve([]),
        catalog: nope as WorkflowsClient['catalog'],
        coverage: nope as WorkflowsClient['coverage'],
        saveVersion: nope as WorkflowsClient['saveVersion'],
        bind: nope as WorkflowsClient['bind'],
        unbind: () => Promise.resolve(),
        migrate,
        projection: () => Promise.resolve(null),
        transition: nope as WorkflowsClient['transition'],
    };
}

describe('@splicewire/beam-workflows mid-tree surfaces mount in isolation', () => {
    it('WorkflowEditor renders the schema-form and saves the draft (no transport of its own)', () => {
        const onSave = vi.fn();
        render(
            <WorkflowEditor
                initial={blueprint()}
                guards={[]}
                effects={[]}
                principals={[]}
                onSave={onSave}
            />,
        );
        // The schema-form authoring surface: places + transitions sections off the draft DTO.
        expect(screen.getByText('Places')).toBeDefined();
        expect(screen.getByLabelText('Place 1 name')).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: /Save as new version/ }));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'publish-flow' }));
    });

    it('WorkflowMigrate routes a dry-run through the injected client + fires notify', async () => {
        const migrate = vi.fn<WorkflowsClient['migrate']>((_key, input: MigrateInput) =>
            Promise.resolve({
                lineageKey: 'publish-flow',
                fromVersionId: input.from,
                toVersionId: input.to,
                total: 3,
                migrated: 3,
                unmappable: [],
                applied: false,
                dryRun: true,
            }),
        );
        const notify = vi.fn();
        const versions: WorkflowVersionData[] = [
            { id: 'v1', version: 1, isActive: false, blueprint: blueprint() },
            { id: 'v2', version: 2, isActive: true, blueprint: blueprint() },
        ];
        render(
            <WorkflowsProvider services={{ client: fakeClient(migrate), notify }}>
                <WorkflowMigrate versions={versions} lineageKey="publish-flow" />
            </WorkflowsProvider>,
        );
        expect(screen.getAllByText('Migrate records').length).toBeGreaterThan(0);
        // Same-named places seed a complete map, so Preview (dry run) is enabled.
        fireEvent.click(screen.getByRole('button', { name: /Preview \(dry run\)/ }));
        await waitFor(() => expect(migrate).toHaveBeenCalledWith('publish-flow', expect.objectContaining({ dryRun: true })));
        await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })));
    });
});

function withProviders(services: WorkflowsServices) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={qc}>
            <WorkflowsProvider services={services}>{children}</WorkflowsProvider>
        </QueryClientProvider>
    );
}

const catalogFixture: WorkflowCatalogData = {
    blueprintSchema: {},
    guards: [],
    effects: [],
    types: [],
    principals: [],
    canAuthor: true,
};

describe('§8a — the full tree mounts off pure generated-DTO fixtures (no Laravel)', () => {
    it('WorkflowsAdminPage renders lineages and routes a save through the injected client', async () => {
        const version: WorkflowVersionData = {
            id: 'v1',
            version: 1,
            isActive: true,
            blueprint: blueprint(),
        };
        const lineage: WorkflowLineageData = {
            key: 'publish-flow',
            name: 'Publish flow',
            isSystem: false,
            boundTypes: [],
            versions: [version],
        };
        const saveVersion = vi.fn<WorkflowsClient['saveVersion']>(() =>
            Promise.resolve({ ...version, id: 'v2', version: 2 }),
        );
        const notify = vi.fn();
        const client = fakeClient(() => Promise.reject(new Error('no migrate here')));
        client.listLineages = () => Promise.resolve([lineage]);
        client.catalog = () => Promise.resolve(catalogFixture);
        client.coverage = () =>
            Promise.resolve({ lineageKey: 'publish-flow', total: 0, versions: [] });
        client.saveVersion = saveVersion;

        const Wrapper = withProviders({ client, notify });
        render(<WorkflowsAdminPage />, { wrapper: Wrapper });

        // The list query resolves through client.listLineages().
        await waitFor(() => expect(screen.getByText('Publish flow')).toBeDefined());

        // Select the lineage → the editor loads its active version (catalog resolved too).
        fireEvent.click(screen.getByText('Publish flow'));
        await waitFor(() => expect(screen.getByRole('button', { name: /Save as new version/ })).toBeDefined());

        // A mutation routes through the injected client and fires notify.
        fireEvent.click(screen.getByRole('button', { name: /Save as new version/ }));
        await waitFor(() => expect(saveVersion).toHaveBeenCalled());
        await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })));
    });

    it("WorkflowActions wires the Stepper's status subscription through the injected subscribe", () => {
        const unsubscribe = vi.fn();
        const subscribe = vi.fn<NonNullable<WorkflowsServices['subscribe']>>(() => unsubscribe);
        const Wrapper = withProviders({
            client: fakeClient(() => Promise.reject(new Error('n/a'))),
            subscribe,
        });
        const { unmount } = render(
            <WorkflowActions
                projection={{
                    type: 'composition',
                    places: ['draft', 'published'],
                    transitions: [],
                    current: 'draft',
                    available: ['publish'],
                }}
                channel="status.App.Models.Composition.abc"
                onTransition={() => {}}
            />,
            { wrapper: Wrapper },
        );
        // The 4th injection kind: the Echo `.status.emitted` subscription is the injected service.
        expect(subscribe).toHaveBeenCalledWith(
            'status.App.Models.Composition.abc',
            '.status.emitted',
            expect.any(Function),
        );
        // An available-driven action button renders off the projection.
        expect(screen.getByRole('button', { name: /Publish/ })).toBeDefined();
        // Unsubscribe runs on teardown.
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });
});
