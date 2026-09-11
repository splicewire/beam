// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type ApiTokenData = {
id: number,
name: string,
provenance: TokenProvenance,
abilities: string[] | null,
created_at: string | null,
last_used_at: string | null,
expires_at: string | null,
archived_at: string | null,
is_current: boolean,
};

export type CreatedTokenData = {
id: number,
name: string,
token: string,
};

export type TokenProvenance = 'api' | 'session' | 'dev' | 'broker' | 'service' | 'passkey' | 'federation';
