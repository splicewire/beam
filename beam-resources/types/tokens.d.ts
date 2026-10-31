// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type ApiTokenData = {
id: string,
name: string,
provenance: TokenProvenance,
abilities: string[] | null,
createdAt: string | null,
lastUsedAt: string | null,
expiresAt: string | null,
archivedAt: string | null,
isCurrent: boolean,
};

export type CreatedTokenData = {
id: string,
name: string,
token: string,
};

export type TokenProvenance = 'api' | 'session' | 'dev' | 'broker' | 'service' | 'passkey' | 'federation';
