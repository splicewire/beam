import { createMessages, type ClientCatalog } from '@schemastud/messages';
import type { WorkflowBlueprintData, WorkflowVersionData } from '@splicewire/beam-resources/types/workflows';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { blockedHeadline, type MigrationReport } from './migratePlan';
import { emptyBlueprint } from './story-fixtures';
import { WorkflowDiff } from './WorkflowDiff';
import { WorkflowEditor } from './WorkflowEditor';
import { WorkflowGraph } from './WorkflowGraph';
import { WorkflowMigrate } from './WorkflowMigrate';
import { WorkflowsProvider } from './provider';
import type { WorkflowsClient } from './types';
import { WorkflowStepperTrack } from './WorkflowStepper';

// Vite's import.meta.glob, typed here (vite is not a direct dependency of this package, so vite/client is not on its
// type path); the call below stays the literal `import.meta.glob(…)` form Vite transforms.
declare global {
    interface ImportMeta {
        glob<T>(pattern: string, options: { import: string }): Record<string, () => Promise<T>>;
    }
}

// Localization 30 part W1: beam-workflows' editor, graph, stepper, diff and migrate copy reads the reader's catalog
// through the seam (its hand-rolled plural on m.choice), and is the pre-30 English, byte for byte, without one. The
// provider module is loaded lazily, so at the parent these render English and fail on the Spanish ASSERTIONS.
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-workflows::messages.diff_compare': { text: 'Comparar', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.version_label': { text: 'versión :version', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.diff_added': { text: 'añadido', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.graph_empty': { text: 'Aún no hay lugares', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.editor_add_place': { text: 'Añadir lugar', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.editor_place_name': { text: 'Nombre del lugar :number', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.stepper_lifecycle': { text: 'Ciclo de vida: :place', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.migrate_records': { text: 'Migrar registros', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.migrate_explainer': {
            text: 'Vuelve a fijar los registros de la versión :from en la versión :to; no los hijos :ref.',
            sourceLocale: 'es',
        },
        'splicewire-beam-workflows::messages.migrate_preview': { text: 'Vista previa', sourceLocale: 'es' },
        'splicewire-beam-workflows::messages.migrate_dry_run_toast': {
            text: 'Simulación: :count registro|Simulación: :count registros',
            sourceLocale: 'es',
        },
        'splicewire-beam-workflows::messages.migrate_blocked': {
            text: ':count registro bloqueó los :total|:count registros bloquearon los :total',
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
async function inLocale(value: ClientCatalog, children: ReactNode): Promise<ReactNode> {
    const Provider = await messageProvider();
    return Provider ? <Provider value={value}>{children}</Provider> : children;
}

const blueprint = (over: Partial<WorkflowBlueprintData> = {}): WorkflowBlueprintData => ({
    name: 'publish-flow',
    places: ['draft', 'published'],
    initial: ['draft'],
    transitions: [{ name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null, reason: null }],
    metadata: null,
    ...over,
});

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

describe('beam-workflows W1 copy reads the seam', () => {
    it('labels the version diff in the reader\'s locale and re-renders it on a live switch', async () => {
        const versions: WorkflowVersionData[] = [
            { id: 'v1', version: 1, isActive: false, blueprint: blueprint({ places: ['draft'], transitions: [] }) },
            { id: 'v2', version: 2, isActive: true, blueprint: blueprint() },
        ];
        const diff = <WorkflowDiff versions={versions} lineageKey="publish-flow" />;
        const view = render(await inLocale(spanish, diff));

        expect(screen.queryByText('Comparar')).not.toBeNull();
        expect(screen.queryByText('añadido')).not.toBeNull();

        view.rerender(await inLocale(english, diff));
        expect(screen.queryByText('Compare')).not.toBeNull();
        expect(screen.queryByText('added')).not.toBeNull();
        expect(screen.queryByText('Comparar')).toBeNull();
    });

    it("labels the editor in the reader's locale and re-renders it on a live switch", async () => {
        const editor = <WorkflowEditor initial={blueprint()} guards={[]} effects={[]} principals={[]} onSave={() => {}} />;
        const view = render(await inLocale(spanish, editor));

        expect(screen.queryByRole('button', { name: 'Añadir lugar' })).not.toBeNull();
        expect(screen.queryByLabelText('Nombre del lugar 1')).not.toBeNull();

        view.rerender(await inLocale(english, editor));
        expect(screen.queryByRole('button', { name: 'Add place' })).not.toBeNull();
        expect(screen.queryByLabelText('Place 1 name')).not.toBeNull();
    });

    it("names the stepper's lifecycle in the reader's locale, the place as the server sent it", async () => {
        const { container } = render(await inLocale(spanish, <WorkflowStepperTrack places={['draft', 'published']} current="draft" />));
        expect(container.querySelector('[aria-label="Ciclo de vida: draft"]')).not.toBeNull();
    });

    it('migrates in the reader\'s locale: the explainer keeps its code, and the toast it hands notify is translated', async () => {
        const notify = vi.fn();
        const nope = () => Promise.reject(new Error('not in this fixture'));
        const client = {
            listLineages: () => Promise.resolve([]), catalog: nope, coverage: nope, saveVersion: nope, bind: nope,
            unbind: () => Promise.resolve(), projection: () => Promise.resolve(null), transition: nope,
            migrate: (_key: string, input: { from: string; to: string }) => Promise.resolve({
                lineageKey: 'publish-flow', fromVersionId: input.from, toVersionId: input.to,
                total: 3, migrated: 3, unmappable: [], applied: false, dryRun: true,
            }),
        } as unknown as WorkflowsClient;
        const versions: WorkflowVersionData[] = [
            { id: 'v1', version: 1, isActive: false, blueprint: blueprint() },
            { id: 'v2', version: 2, isActive: true, blueprint: blueprint() },
        ];
        render(await inLocale(spanish, (
            <WorkflowsProvider services={{ client, notify }}>
                <WorkflowMigrate versions={versions} lineageKey="publish-flow" />
            </WorkflowsProvider>
        )));

        expect(screen.queryAllByText('Migrar registros').length).toBeGreaterThan(0);
        const explainer = screen.queryByText((_, node) => node?.tagName === 'P' && (node.textContent ?? '').startsWith('Vuelve a fijar'));
        expect(explainer).not.toBeNull();
        expect(explainer?.querySelector('code')?.textContent).toBe('$ref');

        const preview = screen.queryByRole('button', { name: 'Vista previa' });
        expect(preview).not.toBeNull();
        fireEvent.click(preview!);
        await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ message: 'Simulación: 3 registros' })));
    });

    it("says an empty graph has no places in the reader's locale", async () => {
        render(await inLocale(spanish, <WorkflowGraph blueprint={emptyBlueprint} />));
        expect(screen.queryByText('Aún no hay lugares')).not.toBeNull();
    });

    it('pluralises the blocked-migration headline through the catalog, English unchanged without one', async () => {
        const report: Omit<MigrationReport, 'unmappable'> = {
            lineageKey: 'x', fromVersionId: 'a', toVersionId: 'b', total: 142, migrated: 0, applied: false, dryRun: true,
        };
        const one: MigrationReport = { ...report, unmappable: [{ id: 'r1', place: 'gone' }] };
        const three: MigrationReport = { ...report, unmappable: [1, 2, 3].map((n) => ({ id: `r${n}`, place: 'gone' })) };

        expect(blockedHeadline(one)).toBe('1 record blocked all 142 — nothing was migrated.');
        expect(blockedHeadline(three)).toBe('3 records blocked all 142 — nothing was migrated.');

        // The package catalog is loaded lazily: at the parent there is none, the headline stays English, and the
        // Spanish expectation fails as an ASSERTION rather than as an import error.
        // import.meta.glob yields no entry (rather than a transform error) when the file is absent.
        const load = import.meta.glob<{ messages: Record<string, string> }>('../messages.default.json', { import: 'default' })['../messages.default.json'];
        const defaults = load ? await load() : null;
        const localized = defaults
            ? (blockedHeadline as (r: typeof three, m: unknown) => string | null)(three, createMessages(defaults.messages, { catalog: spanish }))
            : blockedHeadline(three);
        expect(localized).toBe('3 registros bloquearon los 142');
    });
});
