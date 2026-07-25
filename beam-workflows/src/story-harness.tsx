// SHARED, NON-SHIPPED Storybook harness for the @splicewire/beam-workflows catalog (component-seams
// ticket 26). Mirrors the schemastud story-harness pattern (tickets 15/16): one place that fakes the
// package's ONE injection seam — the `<WorkflowsProvider>` carrying the transport `client` (+ the
// optional feedback / real-time `subscribe` services) — so the transport-driven surfaces
// (`WorkflowsAdminPage`, `WorkflowMigrate`) mount and render against deterministic fixtures with no
// network. The pure-DTO surfaces (`WorkflowGraph`, `WorkflowDiff`, `WorkflowStepperTrack`,
// `RecipientPicker`) need no provider — they take their data as props — but wrapping them is harmless.
//
// NOT part of the shipped surface — excluded from `dist` (tsup entry is `src/index.ts`; this file is
// never imported by it). It imports package source + Storybook/react-query only, never `@/*` (the app)
// — the same portability bar the rehome deny-list enforces one seam later.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { WorkflowsProvider } from './provider';
import type {
    BindInput,
    MigrateInput,
    NotifyEvent,
    Subscribe,
    WorkflowsClient,
    WorkflowsServices,
} from './types';
import type {
    WorkflowBindingData,
    WorkflowCatalogData,
    WorkflowCoverageData,
    WorkflowLineageData,
    WorkflowProjectionData,
    WorkflowVersionData,
} from '@splicewire/_resources/types/workflows';
import { toDraft } from './blueprint';
import {
    catalog as defaultCatalog,
    coverage as defaultCoverage,
    lineages as defaultLineages,
    projection as defaultProjection,
} from './story-fixtures';

/** Delay in ms a mock method resolves after — 0 = synchronous-ish (a microtask), >0 = a "loading" story. */
export interface MockClientOptions {
    lineages?: WorkflowLineageData[];
    catalog?: WorkflowCatalogData;
    coverage?: WorkflowCoverageData;
    projection?: WorkflowProjectionData | null;
    /** When set, a `MigrationReport` the mock `migrate` returns (else a clean dry-run report is synthesized). */
    delayMs?: number;
    /** Make every read hang forever — the "loading" story state (never resolves). */
    hang?: boolean;
}

function settle<T>(value: T, opts: MockClientOptions): Promise<T> {
    if (opts.hang) return new Promise<T>(() => {});
    if (opts.delayMs && opts.delayMs > 0) {
        return new Promise((resolve) => setTimeout(() => resolve(value), opts.delayMs));
    }
    return Promise.resolve(value);
}

/**
 * A fully in-memory `WorkflowsClient` over the fixtures. Reads return the fixture data; writes are
 * no-op acknowledgements (the catalog stories exercise render states, not persistence). `migrate`
 * returns a clean dry-run report so the wizard's happy path renders.
 */
export function makeMockClient(opts: MockClientOptions = {}): WorkflowsClient {
    const lineages = opts.lineages ?? defaultLineages;
    const catalog = opts.catalog ?? defaultCatalog;
    const coverage = opts.coverage ?? defaultCoverage;
    const projection = opts.projection === undefined ? defaultProjection : opts.projection;

    return {
        listLineages: () => settle(lineages, opts),
        catalog: () => settle(catalog, opts),
        coverage: (key: string) => settle({ ...coverage, lineageKey: key }, opts),
        saveVersion: (_key: string, blueprint) =>
            settle<WorkflowVersionData>(
                { id: 'new-ver', version: 99, isActive: true, blueprint: toDraft(blueprint) },
                opts,
            ),
        bind: (input: BindInput) =>
            settle<WorkflowBindingData>(
                { typeKey: input.typeKey, lineageRef: input.lineageRef, params: input.params ?? {} },
                opts,
            ),
        unbind: () => settle<void>(undefined, opts),
        migrate: (key: string, input: MigrateInput) =>
            settle(
                {
                    lineageKey: key,
                    fromVersionId: input.from,
                    toVersionId: input.to,
                    total: 130,
                    migrated: input.dryRun ? 0 : 130,
                    unmappable: [],
                    applied: !input.dryRun,
                    dryRun: input.dryRun,
                },
                opts,
            ),
        projection: () => settle(projection, opts),
        transition: (_kind, _id, _name) =>
            settle<WorkflowProjectionData>(
                projection ?? {
                    type: '',
                    places: [],
                    transitions: [],
                    current: '',
                    available: [],
                },
                opts,
            ),
    };
}

/** A no-op subscribe (nothing to listen to in a static story). */
const noopSubscribe: Subscribe = () => () => {};

/**
 * Wrap a story in a fresh QueryClient + a mocked `<WorkflowsProvider>`. A fresh client per mount keeps
 * stories isolated (no cache bleed across the catalog). `notify` defaults to a no-op so a story never
 * logs to the Storybook console.
 */
export function MockWorkflowsProvider({
    children,
    client,
    notify,
    subscribe = noopSubscribe,
}: {
    children: ReactNode;
    client?: WorkflowsClient;
    notify?: (event: NotifyEvent) => void;
    subscribe?: Subscribe;
}) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const services: WorkflowsServices = {
        client: client ?? makeMockClient(),
        notify: notify ?? (() => {}),
        subscribe,
    };
    return (
        <QueryClientProvider client={queryClient}>
            <WorkflowsProvider services={services}>{children}</WorkflowsProvider>
        </QueryClientProvider>
    );
}
