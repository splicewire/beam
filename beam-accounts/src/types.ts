import type { ReactNode } from 'react';
// The generated DTO projection (rehome-components 01/08): the PHP `#[TypeScript]` types,
// sliced off the app's single `generated.d.ts` and delivered as a bundle. This build-time
// dependency is LOAD-BEARING (contract §2) — the component's default typing IS the projection,
// so the PHP source of truth genuinely travels into this package. tsup inlines these into the
// shipped `dist/index.d.ts`, so a consumer needs no separate `_resources` dependency.
import type {
    ApiTokenData,
    CreatedTokenData,
    TokenProvenance,
} from '@splicewire/_resources/types/tokens';

export type { ApiTokenData, CreatedTokenData, TokenProvenance };

export interface CreateTokenInput {
    name: string;
    /** Omit (or empty) for an unscoped, act-fully-as-you token; else a subset of your perms. */
    abilities?: string[];
    /** Token lifetime in days; omit (or 0) for a token that never expires. */
    expiresInDays?: number;
}

export interface LifecycleInput {
    id: number;
    expiresInDays?: number;
}

export interface RevokeOthersResult {
    revoked: number;
    message: string;
}

/**
 * The injected transport adapter — the ONE thing a host must implement (contract §1). It wraps
 * whatever transport the host already has (axios, fetch, a server action) and points it at the
 * correct tenant; the component is tenant-blind (contract §7). Generic over the row DTO with a
 * default bound to the generated projection: DTO-first with zero host effort by default, while a
 * non-Laravel host with a divergent shape can bind `TokensClient<MyShape>`.
 */
export interface TokensClient<TToken = ApiTokenData> {
    list(): Promise<TToken[]>;
    create(input: CreateTokenInput): Promise<CreatedTokenData>;
    renew(input: LifecycleInput): Promise<TToken>;
    rotate(input: LifecycleInput): Promise<CreatedTokenData>;
    /** Archive (soft-revoke): stops the token, retains the row for audit. */
    archive(id: number): Promise<void>;
    /** Permanently delete an archived token (hard delete). */
    remove(id: number): Promise<void>;
    /** "Log out everywhere else" — revoke every session token except the current one. */
    revokeOtherSessions(): Promise<RevokeOthersResult>;
    /** Held permission-names for the scoped-create picker (the `GET me` coupling, ADR-0109). */
    listPermissions(): Promise<string[]>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback and host chrome are optional with dependency-free defaults.
 */
export interface TokensServices<TToken = ApiTokenData> {
    client: TokensClient<TToken>;
    /** Feedback sink; a dependency-free console default applies when omitted (no bundled toaster). */
    notify?: (event: NotifyEvent) => void;
    /** Mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * Optional per-row host chrome — e.g. an activity-log popover. The host owns the concept
     * (subject-type, permission gating) and injects the affordance; the component only makes a
     * slot for it. Rendered leading the row's action kebab.
     */
    renderTokenActivity?: (token: TToken) => ReactNode;
}
