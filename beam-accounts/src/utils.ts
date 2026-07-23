import type { ApiTokenData, TokenProvenance } from './types';

// The facet vocabulary + how each type reads as a chip. `api` is the type this surface exists
// to give a stable list of, so it leads and is the default filter; sessions/dev/broker are churn.
export const FACETS: TokenProvenance[] = ['api', 'session', 'dev', 'broker'];

export const PROVENANCE_LABEL: Record<TokenProvenance, string> = {
    api: 'API',
    session: 'Session',
    dev: 'Dev',
    broker: 'Broker',
};

export const PROVENANCE_BADGE: Record<TokenProvenance, 'default' | 'secondary' | 'outline'> = {
    api: 'default',
    session: 'secondary',
    dev: 'outline',
    broker: 'outline',
};

// Lifetime presets for minting / renewing / rotating — "never" is the default.
export const EXPIRY_OPTIONS = [
    { value: '0', label: 'Never expires' },
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
];

export function asProvenance(value: string): TokenProvenance {
    return (FACETS as string[]).includes(value) ? (value as TokenProvenance) : 'api';
}

export function isExpired(token: ApiTokenData): boolean {
    return !!token.expires_at && new Date(token.expires_at).getTime() < Date.now();
}

/** Locale date, or an em-dash for a null/absent value. Portable browser API only. */
export function formatDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleDateString() : '—';
}

/**
 * A human message off an unknown thrown value — transport-agnostic (no axios). The injected
 * adapter is expected to throw an `Error` whose `message` is the server's, so this reads it
 * without knowing the transport.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message) return message;
    }
    return fallback;
}
