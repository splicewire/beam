import type { ApiTokenData, TokenProvenance } from './types';

// The facet vocabulary + how each type reads as a chip. `api` is the type this surface exists
// to give a stable list of, so it leads and is the default filter; sessions/dev/broker are churn.
export const FACETS: TokenProvenance[] = ['api', 'session', 'dev', 'broker', 'passkey'];

export const PROVENANCE_LABEL: Record<TokenProvenance, string> = {
    api: 'API',
    session: 'Session',
    dev: 'Dev',
    broker: 'Broker',
    passkey: 'Passkey',
    // Two machine principals the generated projection grew after this map was written
    // (`federation` in _resources 753d57c, `service` in the 79411d4 regen). They are absent
    // from FACETS above — a deliberate 5-of-7 filter subset — but required here, because
    // both maps are exhaustive over TokenProvenance.
    federation: 'Federation',
    service: 'Service',
};

export const PROVENANCE_BADGE: Record<TokenProvenance, 'default' | 'secondary' | 'outline'> = {
    api: 'default',
    session: 'secondary',
    dev: 'outline',
    broker: 'outline',
    passkey: 'secondary',
    // Machine principals read as `outline`, alongside `broker` — the badge the flagship's own
    // copy of this surface already gives them (splicewire-app 6d8c90109).
    federation: 'outline',
    service: 'outline',
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
