import type { ApiTokenData, TokenProvenance } from "./types";
import type { BeamAccountsMessageKey } from "./messages";

// The facet vocabulary + how each type reads as a chip. `api` is the type this surface exists
// to give a stable list of, so it leads and is the default filter; sessions/dev/broker are churn.
export const FACETS: TokenProvenance[] = [
  "api",
  "session",
  "dev",
  "broker",
  "passkey",
];

export const PROVENANCE_LABEL: Record<TokenProvenance, BeamAccountsMessageKey> = {
  api: 'splicewire-beam-accounts::messages.tokens_type_api',
  session: 'splicewire-beam-accounts::messages.tokens_type_session',
  dev: 'splicewire-beam-accounts::messages.tokens_type_dev',
  broker: 'splicewire-beam-accounts::messages.tokens_type_broker',
  passkey: 'splicewire-beam-accounts::messages.tokens_type_passkey',
  // Two machine principals the generated projection grew after this map was written
  // (`federation` in _resources 753d57c, `service` in the 79411d4 regen). They are absent
  // from FACETS above — a deliberate 5-of-7 filter subset — but required here, because
  // both maps are exhaustive over TokenProvenance.
  federation: 'splicewire-beam-accounts::messages.tokens_type_federation',
  service: 'splicewire-beam-accounts::messages.tokens_type_service',
};

export const PROVENANCE_BADGE: Record<
  TokenProvenance,
  "default" | "secondary" | "outline"
> = {
  api: "default",
  session: "secondary",
  dev: "outline",
  broker: "outline",
  passkey: "secondary",
  // Machine principals read as `outline`, alongside `broker` — the badge the flagship's own
  // copy of this surface already gives them (splicewire-app 6d8c90109).
  federation: "outline",
  service: "outline",
};

// Lifetime presets for minting / renewing / rotating — "never" is the default.
/** Expiry choices: `labelKey` renders in the reader's locale (map through messages where a select needs `label`). */
export const EXPIRY_OPTIONS = [
  { value: "0", labelKey: 'splicewire-beam-accounts::messages.tokens_never_expires' },
  { value: "7", labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_7_days' },
  { value: "30", labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_30_days' },
  { value: "60", labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_60_days' },
  { value: "90", labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_90_days' },
] as const;

export function asProvenance(value: string): TokenProvenance {
  return (FACETS as string[]).includes(value)
    ? (value as TokenProvenance)
    : "api";
}

export function isExpired(token: ApiTokenData): boolean {
  return !!token.expiresAt && new Date(token.expiresAt).getTime() < Date.now();
}

/** Locale date, or an em-dash for a null/absent value. Portable browser API only. */
export function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

/**
 * A human message off an unknown thrown value — transport-agnostic (no axios). The injected
 * adapter is expected to throw an `Error` whose `message` is the server's, so this reads it
 * without knowing the transport.
 */
export function errorMessage(
  error: unknown,
  /** The caller's catalog line for a failure without a message of its own. */
  fallback: string
): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
