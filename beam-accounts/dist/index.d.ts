import * as react from 'react';
import { ReactNode, ComponentProps } from 'react';
import * as _splicewire_beam_resources_types_tokens from '@splicewire/beam-resources/types/tokens';
import { ApiTokenData, CreatedTokenData } from '@splicewire/beam-resources/types/tokens';
export { ApiTokenData, CreatedTokenData, TokenProvenance } from '@splicewire/beam-resources/types/tokens';
import { SessionRequest } from '@schemastud/frame/session';
import * as _tanstack_react_query from '@tanstack/react-query';
import { ComboboxPrimitives } from '@schemastud/combobox';
import { DemoAccountLinkData, DemoUserLinkData } from '@splicewire/beam-resources/types/accounts-pages';
import { Input } from '@schemastud/ui';
import { MembershipData, InvitationData, RoleOptionsData } from '@splicewire/beam-resources/types/accounts';
import * as _schemastud_messages from '@schemastud/messages';

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

/**
 * Where the account-tier token routes are mounted, as laravel-beam-accounts builds them from its own route names
 * (`beam.accounts.tokens.*`, under the configured `beam.accounts.api_root`) and hands them to the tokens page as
 * props. Nothing here spells the root: a host that moves `ACCOUNT_API_ROOT` moves these with it.
 *
 * A record's routes hang off `index`: `${index}/${id}` (archive), `/renew`, `/rotate` and `/permanent`.
 */
interface TokensEndpoints {
    /** `tokens.index` (GET, the roster) and `tokens.store` (POST, the reveal-once mint): one URL. */
    index: string;
    /** `tokens.permissions`: the held permission names the scoped-create picker offers. */
    permissions: string;
    /** `tokens.sessions.others`: revoke every session token but the current one. */
    sessionsOthers: string;
}
/**
 * The tokens client over the host's session request (ruled in frame-foundation 48, ticket 51). It unwraps the
 * `{data}` envelope and ships no default request: the host passes `createSessionRequest()` from
 * `@schemastud/frame/session`. A refusal is the request's `FrameActionError`, read structurally (`status`, `errors`,
 * `message`), so a 422's field errors reach the form and any other refusal its message.
 */
declare function createTokensClient(request: SessionRequest, endpoints: TokensEndpoints): TokensClient;

declare function useTokens(): _tanstack_react_query.UseQueryResult<NoInfer<_splicewire_beam_resources_types_tokens.ApiTokenData[]>, Error>;
/** Held permission-names for the scoped-create picker (the `GET me` coupling, ADR-0109). */
declare function usePermissions(): _tanstack_react_query.UseQueryResult<NoInfer<string[]>, Error>;
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
declare function usePasskeys(): _tanstack_react_query.UseQueryResult<NoInfer<PasskeyData[]>, Error>;
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

/** One demo subject's one-click sign-in, as the server publishes it (`AuthEntryPageData.demoAccounts`). */
type DemoLoginAccount = DemoAccountLinkData;
/** One "any user" picker result, as `GET users/demo-search` returns it; `url` is the signed, expiring login-as link. */
type DemoLoginUser = DemoUserLinkData;
/** What the visitor chose: a demo subject from the roster, or any user from the picker. */
type DemoLoginChoice = ({
    kind: 'account';
} & DemoLoginAccount) | ({
    kind: 'user';
} & DemoLoginUser);
interface DemoLoginProps {
    /** The demo-subject roster (`AuthEntryPageData.demoAccounts`). Empty or absent draws no roster. */
    accounts?: DemoLoginAccount[];
    /**
     * Where the "log in as any user" picker searches (`AuthEntryPageData.demoUserSearchUrl`). The server sets it only
     * on a local host with every demo gate open, so absent means no picker. Ignored when `search` is supplied.
     */
    searchUrl?: string | null;
    /**
     * The picker's transport, for a host that does not reach `searchUrl` with a same-origin `fetch` (a token SPA on
     * another origin). Supplying it turns the picker on.
     */
    search?: (query: string) => Promise<DemoLoginUser[]>;
    /**
     * What a choice does. Defaults to a full GET of its signed `url`, which signs a SESSION host in and redirects. A
     * token host converts the choice into its own hand-off instead (the flagship's `/dev/login-as` hop).
     */
    onSelect?: (choice: DemoLoginChoice) => void;
    /** The atoms the picker renders into. Defaults to `@schemastud/ui`'s. */
    primitives?: ComboboxPrimitives;
    /** Placement classes for the section, e.g. its margin under a form. */
    className?: string;
}
/** The default transport: a same-origin GET of the declared `users.demo-search` op, unwrapping beam's envelope. */
declare function fetchDemoUsers(searchUrl: string): (query: string) => Promise<DemoLoginUser[]>;
/**
 * The login page's demo sign-in (S1, owner-review-20261026 ticket 01): the demo-subject roster as one-click buttons,
 * and, on a local host, a typeahead that signs in as ANY user. Portable and transport-injected like the rest of the
 * auth panels: a session host mounts it as-is in `LoginPanel`'s `footer` (or beside its own form), a token host
 * supplies `search` and `onSelect`.
 *
 * Every gate is the server's. The roster arrives only when the host is in demo mode, the search URL only when the
 * third, local-only gate holds; this component draws exactly what it is given and nothing when it is given nothing.
 */
declare function DemoLogin({ accounts, searchUrl, search, onSelect, primitives, className, }: DemoLoginProps): react.JSX.Element | null;

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

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
declare const englishBeamAccountsMessages: _schemastud_messages.Messages<"splicewire-beam-accounts::messages.account_account" | "splicewire-beam-accounts::messages.account_no_payment_method" | "splicewire-beam-accounts::messages.account_open_navigation" | "splicewire-beam-accounts::messages.account_plan" | "splicewire-beam-accounts::messages.account_profile" | "splicewire-beam-accounts::messages.account_upgrade" | "splicewire-beam-accounts::messages.auth_email" | "splicewire-beam-accounts::messages.auth_forgot_password" | "splicewire-beam-accounts::messages.auth_hide_password" | "splicewire-beam-accounts::messages.auth_passkey_registration_cancelled" | "splicewire-beam-accounts::messages.auth_passkey_registration_unavailable" | "splicewire-beam-accounts::messages.auth_passkey_rename_unavailable" | "splicewire-beam-accounts::messages.auth_passkey_signin_unavailable" | "splicewire-beam-accounts::messages.auth_passkey_verification_cancelled" | "splicewire-beam-accounts::messages.auth_show_password" | "splicewire-beam-accounts::messages.create_team_cancel" | "splicewire-beam-accounts::messages.create_team_creating" | "splicewire-beam-accounts::messages.create_team_description" | "splicewire-beam-accounts::messages.create_team_heading" | "splicewire-beam-accounts::messages.create_team_name" | "splicewire-beam-accounts::messages.create_team_placeholder" | "splicewire-beam-accounts::messages.create_team_submit" | "splicewire-beam-accounts::messages.demo_accounts" | "splicewire-beam-accounts::messages.demo_any_user" | "splicewire-beam-accounts::messages.demo_heading" | "splicewire-beam-accounts::messages.demo_local_only" | "splicewire-beam-accounts::messages.demo_never_production" | "splicewire-beam-accounts::messages.demo_no_match" | "splicewire-beam-accounts::messages.demo_search" | "splicewire-beam-accounts::messages.demo_searching" | "splicewire-beam-accounts::messages.demo_sign_in_as" | "splicewire-beam-accounts::messages.forgot_back" | "splicewire-beam-accounts::messages.forgot_description" | "splicewire-beam-accounts::messages.forgot_failed" | "splicewire-beam-accounts::messages.forgot_sending" | "splicewire-beam-accounts::messages.forgot_sent" | "splicewire-beam-accounts::messages.forgot_submit" | "splicewire-beam-accounts::messages.fragment_id" | "splicewire-beam-accounts::messages.fragment_id_label" | "splicewire-beam-accounts::messages.fragment_id_short" | "splicewire-beam-accounts::messages.fragment_secret" | "splicewire-beam-accounts::messages.invite_a_teammate" | "splicewire-beam-accounts::messages.invite_accept" | "splicewire-beam-accounts::messages.invite_create_account" | "splicewire-beam-accounts::messages.invite_create_or_login" | "splicewire-beam-accounts::messages.invite_dashboard" | "splicewire-beam-accounts::messages.invite_expired" | "splicewire-beam-accounts::messages.invite_expired_ask_named" | "splicewire-beam-accounts::messages.invite_expired_ask_team" | "splicewire-beam-accounts::messages.invite_invalid" | "splicewire-beam-accounts::messages.invite_invalid_body" | "splicewire-beam-accounts::messages.invite_invited_line" | "splicewire-beam-accounts::messages.invite_join" | "splicewire-beam-accounts::messages.invite_joining" | "splicewire-beam-accounts::messages.invite_log_in" | "splicewire-beam-accounts::messages.invite_log_out" | "splicewire-beam-accounts::messages.invite_member_role" | "splicewire-beam-accounts::messages.invite_signed_in_as" | "splicewire-beam-accounts::messages.invite_the_team" | "splicewire-beam-accounts::messages.invite_used" | "splicewire-beam-accounts::messages.invite_used_body" | "splicewire-beam-accounts::messages.invite_wrong_account" | "splicewire-beam-accounts::messages.invite_wrong_account_body" | "splicewire-beam-accounts::messages.login_invalid" | "splicewire-beam-accounts::messages.login_or_email" | "splicewire-beam-accounts::messages.login_password" | "splicewire-beam-accounts::messages.login_remember_me" | "splicewire-beam-accounts::messages.login_sign_in" | "splicewire-beam-accounts::messages.login_signing_in" | "splicewire-beam-accounts::messages.login_title" | "splicewire-beam-accounts::messages.passkey_sign_in" | "splicewire-beam-accounts::messages.passkey_waiting" | "splicewire-beam-accounts::messages.passkeys_add" | "splicewire-beam-accounts::messages.passkeys_cancel_rename" | "splicewire-beam-accounts::messages.passkeys_dates" | "splicewire-beam-accounts::messages.passkeys_delete_named" | "splicewire-beam-accounts::messages.passkeys_description" | "splicewire-beam-accounts::messages.passkeys_empty" | "splicewire-beam-accounts::messages.passkeys_heading" | "splicewire-beam-accounts::messages.passkeys_loading" | "splicewire-beam-accounts::messages.passkeys_placeholder" | "splicewire-beam-accounts::messages.passkeys_register" | "splicewire-beam-accounts::messages.passkeys_register_failed" | "splicewire-beam-accounts::messages.passkeys_rename_failed" | "splicewire-beam-accounts::messages.passkeys_rename_named" | "splicewire-beam-accounts::messages.passkeys_save_name" | "splicewire-beam-accounts::messages.passkeys_unsupported" | "splicewire-beam-accounts::messages.passkeys_waiting" | "splicewire-beam-accounts::messages.reset_confirm_password" | "splicewire-beam-accounts::messages.reset_for" | "splicewire-beam-accounts::messages.reset_heading" | "splicewire-beam-accounts::messages.reset_invalid_link" | "splicewire-beam-accounts::messages.reset_mismatch" | "splicewire-beam-accounts::messages.reset_new_password" | "splicewire-beam-accounts::messages.reset_resetting" | "splicewire-beam-accounts::messages.reset_submit" | "splicewire-beam-accounts::messages.team_about_roles" | "splicewire-beam-accounts::messages.team_cancel" | "splicewire-beam-accounts::messages.team_col_identity" | "splicewire-beam-accounts::messages.team_col_role" | "splicewire-beam-accounts::messages.team_col_since" | "splicewire-beam-accounts::messages.team_col_status" | "splicewire-beam-accounts::messages.team_description" | "splicewire-beam-accounts::messages.team_email" | "splicewire-beam-accounts::messages.team_email_placeholder" | "splicewire-beam-accounts::messages.team_empty" | "splicewire-beam-accounts::messages.team_facet_all" | "splicewire-beam-accounts::messages.team_facet_members" | "splicewire-beam-accounts::messages.team_facet_pending" | "splicewire-beam-accounts::messages.team_heading" | "splicewire-beam-accounts::messages.team_invite_description" | "splicewire-beam-accounts::messages.team_invite_failed" | "splicewire-beam-accounts::messages.team_invite_member" | "splicewire-beam-accounts::messages.team_invite_role" | "splicewire-beam-accounts::messages.team_invited_on" | "splicewire-beam-accounts::messages.team_last_owner_remove" | "splicewire-beam-accounts::messages.team_last_owner_role" | "splicewire-beam-accounts::messages.team_load_failed" | "splicewire-beam-accounts::messages.team_loading" | "splicewire-beam-accounts::messages.team_membership_tier" | "splicewire-beam-accounts::messages.team_new_team" | "splicewire-beam-accounts::messages.team_owner" | "splicewire-beam-accounts::messages.team_owners_count" | "splicewire-beam-accounts::messages.team_remove_confirm" | "splicewire-beam-accounts::messages.team_remove_email" | "splicewire-beam-accounts::messages.team_remove_member" | "splicewire-beam-accounts::messages.team_resend" | "splicewire-beam-accounts::messages.team_resend_for" | "splicewire-beam-accounts::messages.team_revoke_confirm" | "splicewire-beam-accounts::messages.team_revoke_invitation" | "splicewire-beam-accounts::messages.team_revoke_invitation_for" | "splicewire-beam-accounts::messages.team_roles_explainer" | "splicewire-beam-accounts::messages.team_select_role" | "splicewire-beam-accounts::messages.team_send_invitation" | "splicewire-beam-accounts::messages.team_sending" | "splicewire-beam-accounts::messages.team_sent" | "splicewire-beam-accounts::messages.team_status_active" | "splicewire-beam-accounts::messages.team_status_pending" | "splicewire-beam-accounts::messages.team_transfer_confirm" | "splicewire-beam-accounts::messages.team_transfer_ownership" | "splicewire-beam-accounts::messages.team_view_pending" | "splicewire-beam-accounts::messages.team_you" | "splicewire-beam-accounts::messages.tokens_archive" | "splicewire-beam-accounts::messages.tokens_archive_named" | "splicewire-beam-accounts::messages.tokens_archived" | "splicewire-beam-accounts::messages.tokens_archived_toast" | "splicewire-beam-accounts::messages.tokens_browser_sessions" | "splicewire-beam-accounts::messages.tokens_cancel" | "splicewire-beam-accounts::messages.tokens_clear_group" | "splicewire-beam-accounts::messages.tokens_col_actions" | "splicewire-beam-accounts::messages.tokens_col_created" | "splicewire-beam-accounts::messages.tokens_col_expires" | "splicewire-beam-accounts::messages.tokens_col_last_used" | "splicewire-beam-accounts::messages.tokens_col_name" | "splicewire-beam-accounts::messages.tokens_col_scope" | "splicewire-beam-accounts::messages.tokens_col_type" | "splicewire-beam-accounts::messages.tokens_copied" | "splicewire-beam-accounts::messages.tokens_copy" | "splicewire-beam-accounts::messages.tokens_copy_key_now" | "splicewire-beam-accounts::messages.tokens_create_description" | "splicewire-beam-accounts::messages.tokens_created_title" | "splicewire-beam-accounts::messages.tokens_days_ago" | "splicewire-beam-accounts::messages.tokens_delete_named" | "splicewire-beam-accounts::messages.tokens_delete_permanently" | "splicewire-beam-accounts::messages.tokens_deleted_toast" | "splicewire-beam-accounts::messages.tokens_description" | "splicewire-beam-accounts::messages.tokens_done" | "splicewire-beam-accounts::messages.tokens_empty" | "splicewire-beam-accounts::messages.tokens_empty_filtered" | "splicewire-beam-accounts::messages.tokens_expired_on" | "splicewire-beam-accounts::messages.tokens_expires_on" | "splicewire-beam-accounts::messages.tokens_expiring" | "splicewire-beam-accounts::messages.tokens_expiry_30_days" | "splicewire-beam-accounts::messages.tokens_expiry_60_days" | "splicewire-beam-accounts::messages.tokens_expiry_7_days" | "splicewire-beam-accounts::messages.tokens_expiry_90_days" | "splicewire-beam-accounts::messages.tokens_fewer_permissions" | "splicewire-beam-accounts::messages.tokens_field_expires" | "splicewire-beam-accounts::messages.tokens_field_expires_hint" | "splicewire-beam-accounts::messages.tokens_field_name" | "splicewire-beam-accounts::messages.tokens_field_name_hint" | "splicewire-beam-accounts::messages.tokens_filter_permissions" | "splicewire-beam-accounts::messages.tokens_filter_type" | "splicewire-beam-accounts::messages.tokens_full_access" | "splicewire-beam-accounts::messages.tokens_group_general" | "splicewire-beam-accounts::messages.tokens_heading" | "splicewire-beam-accounts::messages.tokens_health" | "splicewire-beam-accounts::messages.tokens_hours_ago" | "splicewire-beam-accounts::messages.tokens_leave_unselected" | "splicewire-beam-accounts::messages.tokens_load_failed" | "splicewire-beam-accounts::messages.tokens_mint" | "splicewire-beam-accounts::messages.tokens_minting" | "splicewire-beam-accounts::messages.tokens_minutes_ago" | "splicewire-beam-accounts::messages.tokens_never" | "splicewire-beam-accounts::messages.tokens_never_expires" | "splicewire-beam-accounts::messages.tokens_new_api_token" | "splicewire-beam-accounts::messages.tokens_new_token" | "splicewire-beam-accounts::messages.tokens_no_scopable" | "splicewire-beam-accounts::messages.tokens_only_time" | "splicewire-beam-accounts::messages.tokens_page_access" | "splicewire-beam-accounts::messages.tokens_page_access_full" | "splicewire-beam-accounts::messages.tokens_page_acts_as_you" | "splicewire-beam-accounts::messages.tokens_page_archive_explainer" | "splicewire-beam-accounts::messages.tokens_page_archive_question" | "splicewire-beam-accounts::messages.tokens_page_archived_badge" | "splicewire-beam-accounts::messages.tokens_page_archived_count" | "splicewire-beam-accounts::messages.tokens_page_copy_secret" | "splicewire-beam-accounts::messages.tokens_page_copy_token" | "splicewire-beam-accounts::messages.tokens_page_create" | "splicewire-beam-accounts::messages.tokens_page_create_description" | "splicewire-beam-accounts::messages.tokens_page_create_failed" | "splicewire-beam-accounts::messages.tokens_page_created_title" | "splicewire-beam-accounts::messages.tokens_page_creating" | "splicewire-beam-accounts::messages.tokens_page_delete_explainer" | "splicewire-beam-accounts::messages.tokens_page_delete_question" | "splicewire-beam-accounts::messages.tokens_page_description" | "splicewire-beam-accounts::messages.tokens_page_expired_marker" | "splicewire-beam-accounts::messages.tokens_page_fewer_permissions" | "splicewire-beam-accounts::messages.tokens_page_field_name" | "splicewire-beam-accounts::messages.tokens_page_heading" | "splicewire-beam-accounts::messages.tokens_page_limited" | "splicewire-beam-accounts::messages.tokens_page_loading_permissions" | "splicewire-beam-accounts::messages.tokens_page_manage" | "splicewire-beam-accounts::messages.tokens_page_name_placeholder" | "splicewire-beam-accounts::messages.tokens_page_never" | "splicewire-beam-accounts::messages.tokens_page_new_lifetime" | "splicewire-beam-accounts::messages.tokens_page_permissions" | "splicewire-beam-accounts::messages.tokens_page_pick_permissions" | "splicewire-beam-accounts::messages.tokens_page_renew" | "splicewire-beam-accounts::messages.tokens_page_renew_explainer" | "splicewire-beam-accounts::messages.tokens_page_renew_menu" | "splicewire-beam-accounts::messages.tokens_page_renew_named" | "splicewire-beam-accounts::messages.tokens_page_renewed_toast" | "splicewire-beam-accounts::messages.tokens_page_revoke" | "splicewire-beam-accounts::messages.tokens_page_revoke_all_explainer" | "splicewire-beam-accounts::messages.tokens_page_revoke_all_question" | "splicewire-beam-accounts::messages.tokens_page_rotate_explainer" | "splicewire-beam-accounts::messages.tokens_page_rotate_menu" | "splicewire-beam-accounts::messages.tokens_page_rotate_named" | "splicewire-beam-accounts::messages.tokens_page_secret_once" | "splicewire-beam-accounts::messages.tokens_page_selected_count" | "splicewire-beam-accounts::messages.tokens_page_token_lifetime" | "splicewire-beam-accounts::messages.tokens_page_working" | "splicewire-beam-accounts::messages.tokens_revoke_other_count" | "splicewire-beam-accounts::messages.tokens_revoke_others" | "splicewire-beam-accounts::messages.tokens_revoke_others_explainer" | "splicewire-beam-accounts::messages.tokens_revoke_others_title" | "splicewire-beam-accounts::messages.tokens_rotate" | "splicewire-beam-accounts::messages.tokens_rotated_title" | "splicewire-beam-accounts::messages.tokens_scope_abilities" | "splicewire-beam-accounts::messages.tokens_scope_analyze_media" | "splicewire-beam-accounts::messages.tokens_scope_author_content" | "splicewire-beam-accounts::messages.tokens_scope_author_workflows" | "splicewire-beam-accounts::messages.tokens_scope_checkout_plans" | "splicewire-beam-accounts::messages.tokens_scope_configure_federation_grants" | "splicewire-beam-accounts::messages.tokens_scope_create_marketplace_listings" | "splicewire-beam-accounts::messages.tokens_scope_delete_conduits" | "splicewire-beam-accounts::messages.tokens_scope_edit_site" | "splicewire-beam-accounts::messages.tokens_scope_generate_embeddings" | "splicewire-beam-accounts::messages.tokens_scope_ingest_media" | "splicewire-beam-accounts::messages.tokens_scope_install_marketplace_extensions" | "splicewire-beam-accounts::messages.tokens_scope_manage_billing" | "splicewire-beam-accounts::messages.tokens_scope_manage_platform_objects" | "splicewire-beam-accounts::messages.tokens_scope_manage_platform_permissions" | "splicewire-beam-accounts::messages.tokens_scope_manage_schemas" | "splicewire-beam-accounts::messages.tokens_scope_pin_federation_grants" | "splicewire-beam-accounts::messages.tokens_scope_publish_silo_corpus" | "splicewire-beam-accounts::messages.tokens_scope_pull_federation_grants" | "splicewire-beam-accounts::messages.tokens_scope_purchase_marketplace_extensions" | "splicewire-beam-accounts::messages.tokens_scope_redetermine_declarations" | "splicewire-beam-accounts::messages.tokens_scope_refresh_installed_extensions" | "splicewire-beam-accounts::messages.tokens_scope_remove_installed_extensions" | "splicewire-beam-accounts::messages.tokens_scope_revoke_federation_grants" | "splicewire-beam-accounts::messages.tokens_scope_search_context_scope_embeddings" | "splicewire-beam-accounts::messages.tokens_scope_sync_workspaces" | "splicewire-beam-accounts::messages.tokens_scope_update_conduits" | "splicewire-beam-accounts::messages.tokens_scope_update_marketplace_listings" | "splicewire-beam-accounts::messages.tokens_scope_view_activity" | "splicewire-beam-accounts::messages.tokens_scope_view_billing" | "splicewire-beam-accounts::messages.tokens_scope_view_marketplace_listings" | "splicewire-beam-accounts::messages.tokens_scope_view_usage" | "splicewire-beam-accounts::messages.tokens_scope_withdraw_silo_corpus" | "splicewire-beam-accounts::messages.tokens_select_all" | "splicewire-beam-accounts::messages.tokens_selected_clear" | "splicewire-beam-accounts::messages.tokens_show_archived" | "splicewire-beam-accounts::messages.tokens_showing_all_types" | "splicewire-beam-accounts::messages.tokens_this_session" | "splicewire-beam-accounts::messages.tokens_type_api" | "splicewire-beam-accounts::messages.tokens_type_broker" | "splicewire-beam-accounts::messages.tokens_type_dev" | "splicewire-beam-accounts::messages.tokens_type_federation" | "splicewire-beam-accounts::messages.tokens_type_passkey" | "splicewire-beam-accounts::messages.tokens_type_service" | "splicewire-beam-accounts::messages.tokens_type_session" | "splicewire-beam-accounts::messages.tokens_unscoped_full_access">;
/**
 * The messages object a schema builder or other non-hook helper takes; callers in a render pass the reader's. Spelled
 * from the English object so the published declarations carry the key union and never name the JSON catalog binding.
 */
type BeamAccountsMessages = typeof englishBeamAccountsMessages;
/** One of beam-accounts' catalog keys. */
type BeamAccountsMessageKey = Parameters<BeamAccountsMessages['t']>[0];
/** beam-accounts' package defaults on the host's one message provider (no second provider); English without one. */
declare const useBeamAccountsMessages: () => BeamAccountsMessages;

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

type Messages = ReturnType<typeof useBeamAccountsMessages>;
type Key = Parameters<Messages['t']>[0];
type MessageParameters = Parameters<Messages['t']>[1];
/**
 * A message kept in React state: a catalog line with its data, translated when it renders (so a live locale switch
 * re-renders it), or a raw string the server or a failure supplied, which renders as it arrived. Never store `m.t(...)`.
 */
type Notice = string | {
    readonly key: Key;
    readonly parameters?: MessageParameters;
} | readonly Notice[];
/** A thrown catalog message: callers render `notice`; `message` stays English for logs and diagnostics. */
declare class NoticeError extends Error {
    readonly notice: Notice;
    constructor(notice: Notice);
}

/**
 * A human message off an unknown thrown value — transport-agnostic (no axios). The injected
 * adapter is expected to throw an `Error` whose `message` is the server's, so this reads it
 * without knowing the transport.
 */
declare function errorMessage(error: unknown, 
/** The caller's catalog line for a failure without a message of its own. */
fallback: string, 
/** The reader's catalog: a thrown catalog line (NoticeError) renders in it. */
messages?: BeamAccountsMessages): string;

interface AgreementPromptData {
    key: string;
    readUrl?: string;
    required: boolean;
    version?: number;
    digest?: string;
    kind?: string;
    title?: string;
    label?: string;
    effectiveAt?: string;
    summary?: string | null;
    content?: string;
    legalUrl?: string | null;
}
type AgreementMember = {
    key: string;
    version: number;
    digest: string;
};
/** Loads the optional agreements widget only when the host supplied Agreement props. */
declare function AgreementPrompt({ agreement, values, onChange }: {
    agreement: AgreementPromptData;
    values: Record<string, AgreementMember>;
    onChange: (key: string, value?: AgreementMember) => void;
}): react.JSX.Element;

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
    agreements?: AgreementPromptData[];
    agreementMembers?: Record<string, AgreementMember>;
    onAgreementMembersChange?: (values: Record<string, AgreementMember>) => void;
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

export { AcceptInvitationPanel, type AcceptInvitationPanelProps, type AgreementMember, AgreementPrompt, type AgreementPromptData, type AuthClient, AuthError, AuthProvider, type AuthServices, type BeamAccountsMessageKey, type BeamAccountsMessages, CreateTeamForm, type CreateTeamFormProps, type CreateTokenInput, DemoLogin, type DemoLoginAccount, type DemoLoginChoice, type DemoLoginProps, type DemoLoginUser, ForgotPasswordForm, type ForgotPasswordFormProps, type ForgotPasswordInput, type InvitationState, type LifecycleInput, type LoginInput, LoginPanel, type LoginPanelProps, type Notice, NoticeError, type NotifyEvent, type PasskeyAssertionInput, type PasskeyAttestationInput, PasskeyButton, type PasskeyButtonProps, type PasskeyChallenge, type PasskeyClient, type PasskeyData, PasskeysSection, PasswordInput, ResetPasswordForm, type ResetPasswordFormProps, type ResetPasswordInput, type RevokeOthersResult, type RosterKind, type RosterRow, type RosterStatus, type TeamClient, TeamPage, TeamProvider, type TeamServices, type TokensClient, type TokensEndpoints, TokensPage, TokensProvider, TokensRoster, type TokensServices, createTokensClient, englishBeamAccountsMessages, errorMessage, fetchDemoUsers, isWebAuthnSupported, mergeRoster, ownerCount, runAssertionCeremony, runAttestationCeremony, useArchiveToken, useAuth, useAuthServices, useBeamAccountsMessages, useCreateToken, useDeletePasskey, useLogin, useNotify, usePasskey, usePasskeys, usePermanentlyDeleteToken, usePermissions, useRegisterPasskey, useRenamePasskey, useRenewToken, useRequestPasswordReset, useResetPassword, useRevokeOtherSessions, useRotateToken, useTokens, useTokensServices };
