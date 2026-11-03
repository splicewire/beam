import * as react from 'react';
import { ReactNode, ComponentProps } from 'react';
import * as _splicewire_beam_resources_types_tokens from '@splicewire/beam-resources/types/tokens';
import { ApiTokenData, CreatedTokenData } from '@splicewire/beam-resources/types/tokens';
export { ApiTokenData, CreatedTokenData, TokenProvenance } from '@splicewire/beam-resources/types/tokens';
import * as _tanstack_react_query from '@tanstack/react-query';
import { Input } from '@schemastud/ui';
import { MembershipData, InvitationData, RoleOptionsData } from '@splicewire/beam-resources/types/accounts';

interface CreateTokenInput {
    name: string;
    /** Omit (or empty) for an unscoped, act-fully-as-you token; else a subset of your perms. */
    abilities?: string[];
    /** Token lifetime in days; omit (or 0) for a token that never expires. */
    expiresInDays?: number;
}
interface LifecycleInput {
    /**
     * The token's id as the wire carries it: a STRING, whatever shape the host's key is.
     *
     * ⚠️ Was `number`, mirroring `ApiTokenData.id`'s old `int`. Measured 2026-09-12 on a uuid-keyed
     * host: every roster row claimed the same id and Archive issued `DELETE .../tokens/1` → 500.
     * The PHP DTOs are now string-keyed and the generated projection follows; these hand-written
     * declarations are the half a regeneration cannot reach.
     */
    id: string;
    expiresInDays?: number;
}
interface RevokeOthersResult {
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
interface TokensClient<TToken = ApiTokenData> {
    list(): Promise<TToken[]>;
    create(input: CreateTokenInput): Promise<CreatedTokenData>;
    renew(input: LifecycleInput): Promise<TToken>;
    rotate(input: LifecycleInput): Promise<CreatedTokenData>;
    /** Archive (soft-revoke): stops the token, retains the row for audit. */
    archive(id: string): Promise<void>;
    /** Permanently delete an archived token (hard delete). */
    remove(id: string): Promise<void>;
    /** "Log out everywhere else" — revoke every session token except the current one. */
    revokeOtherSessions(): Promise<RevokeOthersResult>;
    /** Held permission-names for the scoped-create picker (the `GET me` coupling, ADR-0109). */
    listPermissions(): Promise<string[]>;
}
interface NotifyEvent {
    type: "success" | "error";
    message: string;
}
/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback and host chrome are optional with dependency-free defaults.
 */
interface TokensServices<TToken = ApiTokenData> {
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
interface LoginInput {
    email: string;
    password: string;
    /**
     * Stay signed in on a trusted device. App-side this maps to token lifetime
     * (ticket 06); the package only carries the flag through the transport.
     */
    remember?: boolean;
}
interface ForgotPasswordInput {
    email: string;
}
interface ResetPasswordInput {
    email: string;
    token: string;
    password: string;
    passwordConfirmation: string;
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
interface AuthClient<TResult = unknown> {
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
interface PasskeyClient<TResult = unknown> {
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
interface PasskeyChallenge {
    handle: string;
    /** The `navigator.credentials` publicKey options as JSON (base64url fields), from the server. */
    options: Record<string, unknown>;
}
interface PasskeyAssertionInput {
    handle: string;
    /** The assertion PublicKeyCredential serialized to JSON (base64url fields). */
    credential: Record<string, unknown>;
}
interface PasskeyAttestationInput {
    handle: string;
    name: string;
    /** The attestation PublicKeyCredential serialized to JSON (base64url fields). */
    credential: Record<string, unknown>;
}
/** A registered passkey credential, name + when last used (for the management surface). */
interface PasskeyData {
    id: number;
    name: string;
    lastUsedAt: string | null;
    createdAt: string | null;
}
/**
 * Everything host-specific for the auth surfaces, injected through one Provider.
 * Only `client` is required; the error hook is optional.
 */
interface AuthServices<TResult = unknown> {
    client: AuthClient<TResult>;
    /** Mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
}

declare function TokensProvider({ services, children, }: {
    services: TokensServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useTokensServices(): TokensServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useNotify(): (event: NotifyEvent) => void;

/**
 * The API-keys / tokens management surface — portable, tenancy-agnostic, DTO-first. Owns its
 * react-query data logic; takes transport + feedback + host chrome as injected services (see
 * `<TokensProvider>`). Types off the generated `ApiTokenData` projection.
 */
declare function TokensPage(): react.JSX.Element;

declare function useTokens(): _tanstack_react_query.UseQueryResult<_splicewire_beam_resources_types_tokens.ApiTokenData[], Error>;
/** Held permission-names for the scoped-create picker (the `GET me` coupling, ADR-0109). */
declare function usePermissions(): _tanstack_react_query.UseQueryResult<string[], Error>;
declare function useCreateToken(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_tokens.CreatedTokenData, Error, CreateTokenInput, unknown>;
declare function useArchiveToken(): _tanstack_react_query.UseMutationResult<void, Error, string, unknown>;
declare function usePermanentlyDeleteToken(): _tanstack_react_query.UseMutationResult<void, Error, string, unknown>;
declare function useRenewToken(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_tokens.ApiTokenData, Error, LifecycleInput, unknown>;
declare function useRotateToken(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_tokens.CreatedTokenData, Error, LifecycleInput, unknown>;
declare function useRevokeOtherSessions(): _tanstack_react_query.UseMutationResult<RevokeOthersResult, Error, void, unknown>;

declare function AuthProvider({ services, children, }: {
    services: AuthServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useAuthServices(): AuthServices;

declare function useLogin(): _tanstack_react_query.UseMutationResult<unknown, Error, LoginInput, unknown>;
declare function useRequestPasswordReset(): _tanstack_react_query.UseMutationResult<void, Error, ForgotPasswordInput, unknown>;
declare function useResetPassword(): _tanstack_react_query.UseMutationResult<void, Error, ResetPasswordInput, unknown>;
/**
 * Convenience bundle of the three auth mutations for a host that would rather grab them all at
 * once than reach for the individual hooks.
 */
declare function useAuth(): {
    login: _tanstack_react_query.UseMutationResult<unknown, Error, LoginInput, unknown>;
    requestPasswordReset: _tanstack_react_query.UseMutationResult<void, Error, ForgotPasswordInput, unknown>;
    resetPassword: _tanstack_react_query.UseMutationResult<void, Error, ResetPasswordInput, unknown>;
};
/**
 * Passwordless passkey sign-in (ticket 10): fetch a server challenge → run the WebAuthn
 * assertion ceremony in the browser → post the result to mint a token. The result is the same
 * host payload as password login.
 */
declare function usePasskey<TResult = unknown>(): _tanstack_react_query.UseMutationResult<TResult, Error, void, unknown>;
/**
 * Passkey management (ticket 11): list / register (attestation ceremony) / delete, wired the
 * same injected-transport way as the tokens surface.
 */
declare function usePasskeys(): _tanstack_react_query.UseQueryResult<PasskeyData[], Error>;
declare function useRegisterPasskey(): _tanstack_react_query.UseMutationResult<PasskeyData, Error, string, unknown>;
declare function useRenamePasskey(): _tanstack_react_query.UseMutationResult<PasskeyData, Error, {
    id: number;
    name: string;
}, unknown>;
declare function useDeletePasskey(): _tanstack_react_query.UseMutationResult<void, Error, number, unknown>;

interface LoginPanelProps<TResult = unknown> {
    /** The host brand lockup, injected (ADR-0092: brand stays in the app). Rendered above the card. */
    brand?: ReactNode;
    /** Fires with the host's auth-result payload after a successful sign-in. */
    onSuccess: (result: TResult) => void;
    title?: string;
    /**
     * Semantic element for the panel title (UX01 / C37). The panel title is the page's main heading,
     * so it defaults to a real `h1` — hosts set `h2` only when the panel is nested under a page that
     * already owns the `h1`. The CardTitle visual styling is retained either way; this does NOT change
     * the shared `CardTitle` component.
     */
    titleAs?: 'h1' | 'h2';
    description?: string;
    /** Render the passkey button in its slot above the "OR CONTINUE WITH EMAIL" divider. */
    showPasskeySlot?: boolean;
    /** The passkey button (ticket 10). Only shown when `showPasskeySlot` is on. */
    passkeySlot?: ReactNode;
    /** Render the "Remember me" checkbox (ticket 06). */
    showRemember?: boolean;
    /** Render the "Forgot your password?" link (ticket 05). */
    showForgotLink?: boolean;
    /** Invoked when the forgot-password link is clicked (host navigates). */
    onForgot?: () => void;
    /** Host-owned footer below the form — e.g. the "Continue with Google" button. */
    footer?: ReactNode;
}
/**
 * The portable, transport-injected login panel. Every optional control is prop-gated so a host
 * renders only the controls whose backends exist (ticket 03 ships with forgot/remember/passkey
 * gated off; later tickets turn them on). The brand lockup and the Google footer are injected —
 * the package knows nothing about either.
 */
declare function LoginPanel<TResult = unknown>({ brand, onSuccess, title, titleAs: TitleTag, description, showPasskeySlot, passkeySlot, showRemember, showForgotLink, onForgot, footer, }: LoginPanelProps<TResult>): react.JSX.Element;

interface ForgotPasswordFormProps {
    /** The host brand lockup, injected. */
    brand?: ReactNode;
    /** Invoked when the user wants to go back to sign-in. */
    onBack?: () => void;
}
/**
 * Request a reset link. On submit the panel always shows the same enumeration-safe confirmation
 * whether or not the email exists — mirroring the backend's identical response — so the form
 * can't be used to discover which emails have accounts.
 */
declare function ForgotPasswordForm({ brand, onBack }: ForgotPasswordFormProps): react.JSX.Element;

interface ResetPasswordFormProps {
    /** The token + email carried in the reset link URL. */
    token: string;
    email: string;
    /** The host brand lockup, injected. */
    brand?: ReactNode;
    /** Fires after the password is successfully reset (host navigates to sign-in). */
    onSuccess?: () => void;
}
/**
 * Set a new password from a reset link. The token + email are read from the URL by the host and
 * passed in; a mismatch/expired/tampered token surfaces as an inline error ("this reset link has
 * expired") off the backend's rejection.
 */
declare function ResetPasswordForm({ token, email, brand, onSuccess }: ResetPasswordFormProps): react.JSX.Element;

interface PasskeyButtonProps<TResult = unknown> {
    /** Fires with the host's auth-result payload after a successful passkey sign-in. */
    onSuccess: (result: TResult) => void;
    label?: string;
}
/**
 * "Sign in with a passkey" — runs the WebAuthn assertion ceremony and completes sign-in exactly
 * like password login. It renders NOTHING when the device/browser can't do WebAuthn, so a user
 * is never offered something that can't work; a cancelled/failed ceremony surfaces inline.
 */
declare function PasskeyButton<TResult = unknown>({ onSuccess, label }: PasskeyButtonProps<TResult>): react.JSX.Element | null;

/**
 * The settings "Passkeys" surface (ticket 11; rename + registered-date added in admin-redesign
 * ticket 03): register a passkey from a trusted device, see your registered passkeys by name with
 * when each was added + last used, rename one inline, and delete one. Wired the same
 * injected-transport way as the tokens surface; runs the attestation ceremony on register. Rename
 * lights up only when the host supplies a `passkey.rename` transport.
 */
declare function PasskeysSection({ showHeader, }?: {
    /** False when the host frames the section under its own heading and copy (TOWER-05: no duplicate "Passkeys"). */
    showHeader?: boolean;
}): react.JSX.Element;

/**
 * A password `Input` with a show/hide eye toggle, so a user can catch typos before
 * submitting. The toggle is a real button in the tab order with an aria-label that
 * reflects state; the field itself keeps all the usual Input props.
 */
declare function PasswordInput({ className, ...props }: ComponentProps<typeof Input>): react.JSX.Element;
/** An inline, role=alert error line for the auth forms. Renders nothing when empty. */
declare function AuthError({ message }: {
    message?: string | null;
}): react.JSX.Element | null;

/** Whether this device/browser can run WebAuthn ceremonies at all. */
declare function isWebAuthnSupported(): boolean;
/** Run an assertion (login) ceremony; returns the credential as base64url JSON to POST. */
declare function runAssertionCeremony(options: Record<string, unknown>): Promise<Record<string, unknown>>;
/** Run an attestation (registration) ceremony; returns the credential as base64url JSON to POST. */
declare function runAttestationCeremony(options: Record<string, unknown>): Promise<Record<string, unknown>>;

declare function TokensRoster(): react.JSX.Element;

declare function TeamPage({ currentUserId, createTeamHref, }: {
    currentUserId: string | null;
    /** The host's `teams.create` page. Given ⇒ a "New team" link beside the invite control. */
    createTeamHref?: string | null;
}): react.JSX.Element;

type MemberRole = "owner" | "admin" | "member";
type TenantMember = MembershipData;
type TenantInvitation = Pick<InvitationData, "id" | "email" | "role" | "acceptedAt" | "createdAt">;
interface TeamClient {
    members(): Promise<TenantMember[]>;
    invitations(): Promise<TenantInvitation[]>;
    roles(): Promise<RoleOptionsData>;
    updateRole(input: {
        userId: string;
        role: string;
    }): Promise<unknown>;
    removeMember(id: string): Promise<unknown>;
    sendInvitation(input: {
        email: string;
        role: string;
    }): Promise<unknown>;
    revokeInvitation(id: string): Promise<unknown>;
    resendInvitation(id: string): Promise<unknown>;
}
interface TeamServices {
    client: TeamClient;
    notify?: (event: NotifyEvent) => void;
    onError?: (error: unknown) => void;
}

declare function TeamProvider({ services, children, }: {
    services: TeamServices;
    children: ReactNode;
}): react.JSX.Element;

type RosterKind = "member" | "invitation";
type RosterStatus = "Active" | "Pending";
interface RosterRow {
    id: string;
    kind: RosterKind;
    status: RosterStatus;
    name: string | null;
    email: string;
    role: MemberRole | string;
    /** ISO — `joinedAt` for members, `createdAt` (invited-at) for pending invitations. */
    since: string | null;
    /** True only for the caller's own member row (self-action guards). */
    isSelf: boolean;
}
declare function mergeRoster(memberRows: TenantMember[], inviteRows: TenantInvitation[], selfId: string | null): RosterRow[];
/** Count of `owner` pivot rows — the min-1-owner invariant reads off this to lock the last owner. */
declare function ownerCount(memberRows: TenantMember[]): number;

interface CreateTeamFormProps {
    /** Submit the new team's name. The host posts it to the `teams.store` operation. */
    onSubmit: (input: {
        name: string;
    }) => void;
    /** True while the host's request is in flight. */
    processing?: boolean;
    /** Field errors from the server (`name`), keyed as the operation's validator names them. */
    errors?: {
        name?: string;
    };
    /** Where "Cancel" goes. Omitted ⇒ no cancel link. */
    cancelHref?: string | null;
    /** Pre-fill the name (a story, or a host suggesting one). */
    defaultName?: string;
}
/**
 * Start a team: one field, one button. The creator becomes the team's Owner and it becomes their current
 * team — facts of the server operation, not of this form, which only collects the name.
 *
 * Transport-free like every surface in this package: the host decides how `onSubmit` reaches the
 * server (beam-inertia's `account/create-team` page posts through Inertia so validation errors come
 * back as `errors`).
 */
declare function CreateTeamForm({ onSubmit, processing, errors, cancelHref, defaultName }: CreateTeamFormProps): react.JSX.Element;

/**
 * The server's verdict on an invitation link for the current viewer — `InvitationRedemption` in
 * `splicewire/laravel-beam-accounts`, carried as the `state` prop of the `invitations.accept` page.
 */
type InvitationState = 'ready' | 'guest' | 'wrong-account' | 'expired' | 'used' | 'invalid';
interface AcceptInvitationPanelProps {
    state: InvitationState;
    /** Null when the link resolved to no live invitation (`invalid`): a bad link names nothing. */
    teamName?: string | null;
    /** The invited address. */
    email?: string | null;
    role?: string | null;
    inviterName?: string | null;
    /** Who is signed in, for the `wrong-account` explanation. */
    viewerEmail?: string | null;
    /** Take the seat. Offered only in the `ready` state. */
    onAccept?: () => void;
    processing?: boolean;
    /** Why the last accept was refused (the redeem operation's `invitation` error). */
    error?: string | null;
    registerHref?: string | null;
    loginHref?: string | null;
    /** Sign out so the invited address can sign in. Offered in the `wrong-account` state. */
    onLogout?: () => void;
    /** Where "Go to your dashboard" leads, for states with nothing left to do. */
    homeHref?: string | null;
}
/**
 * What an invitee sees when they open the emailed link: the invitation, and the ONE next step their
 * situation allows — accept it, register or log in first, sign out of the wrong account, or nothing
 * (expired, used, invalid) with the reason.
 *
 * Transport-free: the host supplies `onAccept` / `onLogout` and the hrefs, and renders the page chrome.
 */
declare function AcceptInvitationPanel(props: AcceptInvitationPanelProps): react.JSX.Element;

export { AcceptInvitationPanel, type AcceptInvitationPanelProps, type AuthClient, AuthError, AuthProvider, type AuthServices, CreateTeamForm, type CreateTeamFormProps, type CreateTokenInput, ForgotPasswordForm, type ForgotPasswordFormProps, type ForgotPasswordInput, type InvitationState, type LifecycleInput, type LoginInput, LoginPanel, type LoginPanelProps, type NotifyEvent, type PasskeyAssertionInput, type PasskeyAttestationInput, PasskeyButton, type PasskeyButtonProps, type PasskeyChallenge, type PasskeyClient, type PasskeyData, PasskeysSection, PasswordInput, ResetPasswordForm, type ResetPasswordFormProps, type ResetPasswordInput, type RevokeOthersResult, type RosterKind, type RosterRow, type RosterStatus, type TeamClient, TeamPage, TeamProvider, type TeamServices, type TokensClient, TokensPage, TokensProvider, TokensRoster, type TokensServices, isWebAuthnSupported, mergeRoster, ownerCount, runAssertionCeremony, runAttestationCeremony, useArchiveToken, useAuth, useAuthServices, useCreateToken, useDeletePasskey, useLogin, useNotify, usePasskey, usePasskeys, usePermanentlyDeleteToken, usePermissions, useRegisterPasskey, useRenamePasskey, useRenewToken, useRequestPasswordReset, useResetPassword, useRevokeOtherSessions, useRotateToken, useTokens, useTokensServices };
