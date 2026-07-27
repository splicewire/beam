/* eslint-disable */
// =============================================================================
// story-harness — the shared Storybook fixtures for the @splicewire/beam-versioning
// catalog. NOT part of the shipped package: tsup builds only the `index.ts` graph
// (see tsup.config.ts), so this file — imported solely by *.stories.tsx and the
// mount test — never enters `dist`.
//
// One injection family: the VERSIONS surface reads
// `<VersionsProvider services={{ client: VersionsClient, notify?, onError?, renderVersionMeta? }}>`.
// The host owns the QueryClient (contract §1/§6); we supply one here per mount.
//
// Every mock is fixtures-only (no real network): list/save/restore resolve or hang
// after a settable delay so a story can `play`-drive to a SETTLED state (populated /
// empty / loading / error) that a future VR baseline captures — never a transient flash.
// =============================================================================
import { useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VersionsProvider } from './provider';
import type { VersionData, VersionsClient, VersionsServices } from './types';

function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: Infinity },
            mutations: { retry: false },
        },
    });
}

const never = new Promise<never>(() => {});

export const SAMPLE_VERSIONS: VersionData[] = [
    {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        version: 3,
        readable: 'v3',
        label: 'after the rewrite',
        createdBy: 'usr_ada',
        createdAt: '2026-07-25T08:00:00Z',
        isHead: true,
    },
    {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        version: 2,
        readable: 'v2',
        label: 'before the rewrite',
        createdBy: 'usr_ada',
        createdAt: '2026-07-20T12:00:00Z',
        isHead: false,
    },
    {
        id: '3f333df6-90a4-4fda-8dd3-9485d27cee36',
        version: 1,
        readable: 'v1',
        label: null,
        createdBy: 'usr_grace',
        createdAt: '2026-07-01T09:30:00Z',
        isHead: false,
    },
];

export interface VersionsMockConfig {
    /** Rows `list()` resolves with. */
    versions?: VersionData[];
    /** `loading` hangs `list()` forever (the loading state); `empty` resolves []; `error` rejects. */
    listState?: 'populated' | 'loading' | 'empty' | 'error';
}

export function makeVersionsClient(config: VersionsMockConfig = {}): VersionsClient {
    const { versions = SAMPLE_VERSIONS, listState = 'populated' } = config;
    const minted: VersionData = {
        id: 'minted-0000-0000-0000-000000000000',
        version: (versions[0]?.version ?? 0) + 1,
        readable: `v${(versions[0]?.version ?? 0) + 1}`,
        label: null,
        createdBy: 'usr_ada',
        createdAt: '2026-07-26T10:00:00Z',
        isHead: true,
    };
    return {
        list: () => {
            if (listState === 'loading') return never;
            if (listState === 'error') return Promise.reject(new Error('boom'));
            return Promise.resolve(listState === 'empty' ? [] : versions);
        },
        save: async () => minted,
        restore: async () => minted,
    };
}

/** Wrap children in a fresh QueryClient + a mocked VersionsProvider. */
export function MockVersionsProvider({
    children,
    config,
    services,
}: {
    children: ReactNode;
    config?: VersionsMockConfig;
    services?: Partial<Omit<VersionsServices, 'client'>>;
}) {
    const client = useMemo(() => makeVersionsClient(config), [JSON.stringify(config)]);
    const queryClient = useMemo(makeQueryClient, [JSON.stringify(config)]);
    return (
        <QueryClientProvider client={queryClient}>
            <VersionsProvider services={{ client, ...services }}>{children}</VersionsProvider>
        </QueryClientProvider>
    );
}

/** A width-bounded stage so the panel reads like the real mounted drawer/sheet. */
export function VersionsStage({ children }: { children: ReactNode }) {
    return <div className="mx-auto w-full max-w-sm p-4">{children}</div>;
}
