/* eslint-disable */
// story-harness — shared Storybook + test fixtures for @splicewire/beam-transforms. NOT shipped:
// tsup builds only the index.ts graph, so this file (imported solely by *.stories.tsx / *.test.tsx)
// never enters dist. A fixtures-only mock TransformsClient + a fresh QueryClient per mount, so a
// story/test data state is deterministic and never bleeds between mounts.
import { useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransformsProvider } from './provider';
import type {
    RunnerTransform,
    RunnerTransformResult,
    TransformsClient,
    TransformsServices,
} from './types';

function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: Infinity },
            mutations: { retry: false },
        },
    });
}

const never = new Promise<never>(() => {});

export const SAMPLE_TRANSFORMS: RunnerTransform[] = [
    {
        id: 't1',
        name: 'Shape payload',
        slug: 'shape-payload',
        description: 'Reshape the upstream tool output.',
        runtime: 'javy',
        code: 'Javy.IO.writeSync(1, new TextEncoder().encode("{}"));',
        io: 'stdio',
        build: 'source',
        link: 'dynamic',
        engineVersion: null,
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        requestedGrant: { net: 'none' },
        effectiveGrant: { net: 'none' },
        deniedAxes: [],
        enabled: true,
        visibility: 'private',
        createdAt: '2026-07-27T00:00:00Z',
        updatedAt: '2026-07-27T00:00:00Z',
    },
    {
        id: 't2',
        name: 'Fetch enrichment',
        slug: 'fetch-enrichment',
        description: 'Wants open net — floored until approved.',
        runtime: 'node',
        code: '// fetch(...)',
        io: 'stdio',
        build: null,
        link: null,
        engineVersion: null,
        inputSchema: null,
        outputSchema: null,
        requestedGrant: { net: 'open' },
        effectiveGrant: { net: 'none' },
        deniedAxes: ['net'],
        enabled: true,
        visibility: 'private',
        createdAt: '2026-07-27T00:00:00Z',
        updatedAt: '2026-07-27T00:00:00Z',
    },
];

const DEMO_RESULT: RunnerTransformResult = {
    outcome: 'success',
    error: null,
    output: { greeting: 'hello, world' },
    stderr: '',
    stderrTruncated: false,
    telemetry: {
        wallMs: 12,
        cpuMs: null,
        memPeakBytes: null,
        exitCode: 0,
        signal: null,
        limitHit: false,
        sandboxed: true,
    },
    deniedAxis: null,
    deniedTarget: null,
};

export interface TransformsMockConfig {
    transforms?: RunnerTransform[];
    listState?: 'populated' | 'loading' | 'empty';
    result?: RunnerTransformResult;
}

export function makeTransformsClient(config: TransformsMockConfig = {}): TransformsClient {
    const { transforms = SAMPLE_TRANSFORMS, listState = 'populated', result = DEMO_RESULT } = config;
    return {
        list: () =>
            listState === 'loading'
                ? never
                : Promise.resolve(listState === 'empty' ? [] : transforms),
        create: async (input) => ({ ...transforms[0], id: 'new', name: input.name ?? 'New' }),
        update: async (id, input) => ({ ...transforms[0], id, name: input.name ?? transforms[0].name }),
        remove: async () => {},
        test: async () => result,
    };
}

export function MockTransformsProvider({
    children,
    config,
    services,
}: {
    children: ReactNode;
    config?: TransformsMockConfig;
    services?: Partial<Omit<TransformsServices, 'client'>>;
}) {
    const client = useMemo(() => makeTransformsClient(config), [JSON.stringify(config)]);
    const queryClient = useMemo(makeQueryClient, [JSON.stringify(config)]);
    return (
        <QueryClientProvider client={queryClient}>
            <TransformsProvider services={{ client, ...services }}>{children}</TransformsProvider>
        </QueryClientProvider>
    );
}
