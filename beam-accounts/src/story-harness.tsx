/* eslint-disable */
// =============================================================================
// story-harness — the shared Storybook fixtures for the @splicewire/beam-accounts
// catalog (component-seams map, ticket 25). NOT part of the shipped package: tsup
// builds only the `index.ts` graph (see tsup.config.ts), so this file — imported
// solely by *.stories.tsx — never enters `dist`.
//
// beam-accounts has TWO injection families, each a single-required-service provider
// (mirroring frame's mount/injection split, but simpler — both are plain context
// values, no react-query transport is injected *by us*; the host owns the
// QueryClient, contract §1/§6, and we supply one here):
//
//   • AUTH surfaces (LoginPanel / AuthFields / ForgotPassword / ResetPassword /
//     PasskeyButton) read `<AuthProvider services={{ client: AuthClient, onError }}>`.
//   • TOKENS + PASSKEYS-management surfaces (TokensPage / PasskeysSection) read
//     `<TokensProvider>` / `<AuthProvider>` respectively; PasskeysSection reads the
//     AuthProvider's `client.passkey` sub-client.
//
// Every mock is fixtures-only (no real network, no real WebAuthn): the auth/passkey
// ceremonies are stubbed to resolve/reject after a settable delay so a story can
// `play`-drive a form to a SETTLED state (success / validation-error / submitting)
// that a future VR baseline captures — never a transient flash.
//
// @schemastud/ui is already a devDependency (the shipped package injects nothing —
// it imports the foundation directly — so it is a real peer at runtime AND the
// workbench binding here; no package.json change needed for this ticket).
// =============================================================================
import { useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth-provider';
import { TokensProvider } from './provider';
import type {
    ApiTokenData,
    AuthClient,
    AuthServices,
    CreatedTokenData,
    PasskeyClient,
    PasskeyData,
    TokensClient,
    TokensServices,
} from './types';

// ── Fresh QueryClient per mount ─────────────────────────────────────────────────
// Retries off + gcTime 0 so a story's data state is deterministic (a rejected query
// stays rejected, an empty list stays empty) and never bleeds between stories.
function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: Infinity },
            mutations: { retry: false },
        },
    });
}

const never = new Promise<never>(() => {});
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Auth transport mock ─────────────────────────────────────────────────────────
export interface AuthMockConfig {
    /** How the login/reset/forgot mutations settle. `pending` hangs forever (submitting state). */
    outcome?: 'success' | 'error' | 'pending';
    /** Latency before a success/error settles, so `play` can catch the in-flight button. */
    delayMs?: number;
    /** The server message an `error` outcome rejects with. */
    errorMessage?: string;
    /** Give the client a `passkey` sub-client (turns the PasskeyButton slot on). */
    withPasskey?: boolean;
    /** Passkey ceremony outcome, independent of the password outcome. */
    passkeyOutcome?: 'success' | 'error' | 'pending';
    /** Rows the passkeys-management list resolves with. */
    passkeys?: PasskeyData[];
    /** Hold the passkeys-management `list()` open forever (the loading row). */
    passkeysLoading?: boolean;
}

const DEMO_RESULT = { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' };

export function makeAuthClient(config: AuthMockConfig = {}): AuthClient {
    const {
        outcome = 'success',
        delayMs = 0,
        errorMessage = 'Invalid email or password.',
        withPasskey = false,
        passkeyOutcome = 'success',
        passkeys = SAMPLE_PASSKEYS,
        passkeysLoading = false,
    } = config;

    async function settle<T>(value: T, kind = outcome): Promise<T> {
        if (kind === 'pending') return never;
        await wait(delayMs);
        if (kind === 'error') throw new Error(errorMessage);
        return value;
    }

    const passkey: PasskeyClient = {
        loginOptions: () => settle({ handle: 'h', options: {} }, passkeyOutcome),
        login: () => settle(DEMO_RESULT as never, passkeyOutcome),
        registrationOptions: () => settle({ handle: 'h', options: {} }, passkeyOutcome),
        register: () =>
            settle<PasskeyData>(
                { id: 99, name: 'New device', last_used_at: null, created_at: new Date().toISOString() },
                passkeyOutcome,
            ),
        list: () => (passkeysLoading ? never : Promise.resolve(passkeys)),
        rename: (id, name) =>
            settle<PasskeyData>(
                { id, name, last_used_at: null, created_at: new Date().toISOString() },
                passkeyOutcome,
            ),
        remove: async () => settle(undefined),
    };

    return {
        login: () => settle(DEMO_RESULT as never),
        requestPasswordReset: () => settle(undefined),
        resetPassword: () => settle(undefined),
        ...(withPasskey ? { passkey } : {}),
    };
}

export const SAMPLE_PASSKEYS: PasskeyData[] = [
    { id: 1, name: 'MacBook Pro (Touch ID)', last_used_at: '2026-07-20T10:00:00Z', created_at: '2026-01-01T00:00:00Z' },
    { id: 2, name: 'iPhone 15', last_used_at: '2026-07-24T18:30:00Z', created_at: '2026-03-15T00:00:00Z' },
    { id: 3, name: 'YubiKey 5C', last_used_at: null, created_at: '2026-05-01T00:00:00Z' },
];

/** Wrap children in a fresh QueryClient + a mocked AuthProvider. */
export function MockAuthProvider({
    children,
    config,
    onError,
}: {
    children: ReactNode;
    config?: AuthMockConfig;
    onError?: AuthServices['onError'];
}) {
    const client = useMemo(() => makeAuthClient(config), [JSON.stringify(config)]);
    const queryClient = useMemo(makeQueryClient, [JSON.stringify(config)]);
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider services={{ client, onError }}>{children}</AuthProvider>
        </QueryClientProvider>
    );
}

// ── Tokens transport mock ───────────────────────────────────────────────────────
export interface TokensMockConfig {
    /** Rows `list()` resolves with. */
    tokens?: ApiTokenData[];
    /** Held permission-names for the scoped-create picker. */
    permissions?: string[];
    /** `pending` hangs `list()` forever (the loading table); `empty` resolves []. */
    listState?: 'populated' | 'loading' | 'empty';
}

export const SAMPLE_TOKENS: ApiTokenData[] = [
    {
        id: 1, name: 'CI deploys', provenance: 'api', abilities: null,
        created_at: '2026-01-10T00:00:00Z', last_used_at: '2026-07-24T09:00:00Z',
        expires_at: '2026-12-31T00:00:00Z', archived_at: null, is_current: false,
    },
    {
        id: 2, name: 'Read-only metrics', provenance: 'api', abilities: ['metrics.read', 'reports.read'],
        created_at: '2026-02-01T00:00:00Z', last_used_at: '2026-07-01T12:00:00Z',
        expires_at: null, archived_at: null, is_current: false,
    },
    {
        id: 3, name: 'Chrome · macOS', provenance: 'session', abilities: null,
        created_at: '2026-07-25T08:00:00Z', last_used_at: '2026-07-25T08:05:00Z',
        expires_at: null, archived_at: null, is_current: true,
    },
    {
        id: 4, name: 'Firefox · Linux', provenance: 'session', abilities: null,
        created_at: '2026-07-20T08:00:00Z', last_used_at: '2026-07-22T08:00:00Z',
        expires_at: null, archived_at: null, is_current: false,
    },
    {
        id: 5, name: 'Old staging key', provenance: 'api', abilities: ['deploy.write'],
        created_at: '2025-06-01T00:00:00Z', last_used_at: '2025-12-01T00:00:00Z',
        expires_at: '2026-01-01T00:00:00Z', archived_at: '2026-01-02T00:00:00Z', is_current: false,
    },
];

export const SAMPLE_PERMISSIONS = [
    'deploy.write', 'metrics.read', 'reports.read', 'tenants.manage', 'users.invite', 'webhooks.write',
];

export function makeTokensClient(config: TokensMockConfig = {}): TokensClient {
    const { tokens = SAMPLE_TOKENS, permissions = SAMPLE_PERMISSIONS, listState = 'populated' } = config;
    const created: CreatedTokenData = { id: 100, name: 'New token', token: 'sw_live_demo_secret_0123456789abcdef' };
    return {
        list: () =>
            listState === 'loading' ? never
                : Promise.resolve(listState === 'empty' ? [] : tokens),
        create: async () => created,
        renew: async (i) => ({ ...tokens[0], id: i.id }),
        rotate: async () => created,
        archive: async () => {},
        remove: async () => {},
        revokeOtherSessions: async () => ({ revoked: 1, message: 'Signed out 1 other session.' }),
        listPermissions: async () => permissions,
    };
}

/** Wrap children in a fresh QueryClient + a mocked TokensProvider. */
export function MockTokensProvider({
    children,
    config,
    services,
}: {
    children: ReactNode;
    config?: TokensMockConfig;
    services?: Partial<Omit<TokensServices, 'client'>>;
}) {
    const client = useMemo(() => makeTokensClient(config), [JSON.stringify(config)]);
    const queryClient = useMemo(makeQueryClient, [JSON.stringify(config)]);
    return (
        <QueryClientProvider client={queryClient}>
            <TokensProvider services={{ client, ...services }}>{children}</TokensProvider>
        </QueryClientProvider>
    );
}

/** A centered, width-bounded stage so auth panels/cards read like the real mounted surface. */
export function AuthStage({ children, width = 'max-w-sm' }: { children: ReactNode; width?: string }) {
    return <div className={`mx-auto w-full ${width} p-4`}>{children}</div>;
}
