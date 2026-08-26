// SHARED, NON-SHIPPED Storybook harness for the @splicewire/beam-ux catalog. Mirrors the
// beam-workflows story-harness: one place that fakes the package's ONE injection seam — the
// `<UxBuilderProvider>` carrying the transport `client` (+ optional feedback) — so the surfaces mount
// against deterministic fixtures with no network.
//
// NOT part of the shipped surface — excluded from `dist` (tsup entry is `src/index.ts`; this file is
// never imported by it). It imports package source + Storybook/react-query only, never `@/*` (the app).

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { UxBuilderProvider } from './provider';
import type {
    BeamUxEntryBodyData,
    NotifyEvent,
    UxBuilderClient,
    UxBuilderServices,
} from './types';
import { cardEntryBody, plainEntryBody } from './story-fixtures';

/** Delay a mock method resolves after — 0 = a microtask, >0 = a "loading" story. */
export interface MockClientOptions {
    /** Override the loaded body per ENTRY ID; else `entryIds.card` resolves the card fixture. */
    bodies?: Record<string, BeamUxEntryBodyData>;
    delayMs?: number;
    /** Make every read hang forever — the "loading" story state. */
    hang?: boolean;
}

function settle<T>(value: T, opts: MockClientOptions): Promise<T> {
    if (opts.hang) return new Promise<T>(() => {});
    if (opts.delayMs && opts.delayMs > 0) {
        return new Promise((resolve) => setTimeout(() => resolve(value), opts.delayMs));
    }
    return Promise.resolve(value);
}

function bodyFor(id: string, opts: MockClientOptions): BeamUxEntryBodyData {
    if (opts.bodies?.[id]) return opts.bodies[id];
    if (id === cardEntryBody.id) return cardEntryBody;
    return plainEntryBody(id);
}

/**
 * A fully in-memory `UxBuilderClient` over the fixtures. `loadBody` returns the fixture; `saveBody`
 * echoes the submitted body back as a fresh projection (the catalog exercises render states, not
 * persistence).
 */
export function makeMockClient(opts: MockClientOptions = {}): UxBuilderClient {
    return {
        loadBody: (id: string) => settle(bodyFor(id, opts), opts),
        saveBody: (id: string, body: Record<string, unknown>) =>
            settle<BeamUxEntryBodyData>({ ...bodyFor(id, opts), id, body }, opts),
    };
}

/**
 * Wrap a story in a fresh QueryClient + a mocked `<UxBuilderProvider>`. A fresh client per mount keeps
 * stories isolated (no cache bleed across the catalog). `notify` defaults to a no-op so a story never
 * logs to the Storybook console.
 */
export function MockUxBuilderProvider({
    children,
    client,
    notify,
}: {
    children: ReactNode;
    client?: UxBuilderClient;
    notify?: (event: NotifyEvent) => void;
}) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const services: UxBuilderServices = {
        client: client ?? makeMockClient(),
        notify: notify ?? (() => {}),
    };
    return (
        <QueryClientProvider client={queryClient}>
            <UxBuilderProvider services={services}>{children}</UxBuilderProvider>
        </QueryClientProvider>
    );
}
