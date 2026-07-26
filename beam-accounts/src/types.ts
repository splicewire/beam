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

// ─────────────────────────────────────────────────────────────────────────────
// Auth surfaces (login-branding-passkey ticket 02) — the portable login /
// forgot-password / reset-password kit. Same transport-injected + DTO-first
// discipline as the tokens surface: the host supplies ONE `AuthClient`, the
// package logs no one in and knows nothing about Sanctum/tenancy/brand. The
// success payload (the "auth result") is host-shaped — the app returns its
// AuthUserResource, a session host returns whatever it mints — so the surfaces
// are generic over it and simply hand it back through a callback.
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginInput {
    email: string;
    password: string;
    /**
     * Stay signed in on a trusted device. App-side this maps to token lifetime
     * (ticket 06); the package only carries the flag through the transport.
     */
    remember?: boolean;
}

export interface ForgotPasswordInput {
    email: string;
}

export interface ResetPasswordInput {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}

/**
 * The injected auth transport — the ONE thing a host implements. It wraps the
 * host's own HTTP client and points it at the correct endpoints. `TResult` is
 * the host's auth-result payload (the app's AuthUserResource); the package never
 * inspects it — it hands it back through the surface's success callback, so a
 * token host and a session host both consume the same components.
 *
 * Passkey methods are optional: they light up in ticket 10, and a host with no
 * passkey backend simply omits them (the `PasskeyButton` slot stays empty).
 */
export interface AuthClient<TResult = unknown> {
    login(input: LoginInput): Promise<TResult>;
    requestPasswordReset(input: ForgotPasswordInput): Promise<void>;
    resetPassword(input: ResetPasswordInput): Promise<void>;

    /**
     * Optional passkey capability (tickets 10 + 11). A host with a WebAuthn backend supplies the
     * whole sub-client; one without simply omits it and leaves the PasskeyButton / passkeys
     * surface out. Grouping keeps passkey an all-or-nothing capability rather than six
     * independently-optional methods.
     */
    passkey?: PasskeyClient<TResult>;
}

/**
 * The passkey transport. `loginOptions`/`login` drive passwordless sign-in; `registrationOptions`
 * /`register`/`list`/`rename`/`remove` drive the management surface (behind the host's auth).
 */
export interface PasskeyClient<TResult = unknown> {
    loginOptions(): Promise<PasskeyChallenge>;
    login(input: PasskeyAssertionInput): Promise<TResult>;
    registrationOptions(): Promise<PasskeyChallenge>;
    register(input: PasskeyAttestationInput): Promise<PasskeyData>;
    list(): Promise<PasskeyData[]>;
    /**
     * Rename a registered credential (its only editable field). Optional so a host that exposes
     * list/register/remove but no rename endpoint stays valid — the section hides the affordance
     * when it's absent.
     */
    rename?(id: number, name: string): Promise<PasskeyData>;
    remove(id: number): Promise<void>;
}

/** A server-issued WebAuthn challenge: the opaque single-use handle + the browser options. */
export interface PasskeyChallenge {
    handle: string;
    /** The `navigator.credentials` publicKey options as JSON (base64url fields), from the server. */
    options: Record<string, unknown>;
}

export interface PasskeyAssertionInput {
    handle: string;
    /** The assertion PublicKeyCredential serialized to JSON (base64url fields). */
    credential: Record<string, unknown>;
}

export interface PasskeyAttestationInput {
    handle: string;
    name: string;
    /** The attestation PublicKeyCredential serialized to JSON (base64url fields). */
    credential: Record<string, unknown>;
}

/** A registered passkey credential, name + when last used (for the management surface). */
export interface PasskeyData {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string | null;
}

/**
 * Everything host-specific for the auth surfaces, injected through one Provider.
 * Only `client` is required; the error hook is optional.
 */
export interface AuthServices<TResult = unknown> {
    client: AuthClient<TResult>;
    /** Mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
}
