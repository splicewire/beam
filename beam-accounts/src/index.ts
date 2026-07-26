// @splicewire/beam-accounts — the accounts-domain beam surfaces, authored pre-packaged and
// DTO-first (rehome-components; ADR-0092 vendor seam). Mirrors PHP `splicewire/laravel-beam-accounts`.
//
// Customer-zero: the API-keys / tokens management surface. A host renders it by supplying ONE
// transport adapter (+ optional feedback / chrome) through <TokensProvider>; everything else —
// the react-query data logic, the DTO typing off the generated projection, the presentation —
// travels inside the package.

export { TokensProvider, useTokensServices, useNotify } from './provider';
export { TokensPage } from './tokens-page';
export {
    useTokens,
    usePermissions,
    useCreateToken,
    useArchiveToken,
    usePermanentlyDeleteToken,
    useRenewToken,
    useRotateToken,
    useRevokeOtherSessions,
} from './hooks';
export type {
    ApiTokenData,
    CreatedTokenData,
    TokenProvenance,
    TokensClient,
    TokensServices,
    NotifyEvent,
    CreateTokenInput,
    LifecycleInput,
    RevokeOthersResult,
} from './types';

// ── Auth surfaces (login-branding-passkey) ──────────────────────────────────
export { AuthProvider, useAuthServices } from './auth-provider';
export {
    useAuth,
    useLogin,
    useRequestPasswordReset,
    useResetPassword,
    usePasskey,
    usePasskeys,
    useRegisterPasskey,
    useRenamePasskey,
    useDeletePasskey,
} from './auth-hooks';
export { LoginPanel, type LoginPanelProps } from './login-panel';
export { ForgotPasswordForm, type ForgotPasswordFormProps } from './forgot-password-form';
export { ResetPasswordForm, type ResetPasswordFormProps } from './reset-password-form';
export { PasskeyButton, type PasskeyButtonProps } from './passkey-button';
export { PasskeysSection } from './passkeys-section';
export { PasswordInput, AuthError } from './auth-fields';
export { isWebAuthnSupported, runAssertionCeremony, runAttestationCeremony } from './webauthn';
export type {
    AuthClient,
    PasskeyClient,
    AuthServices,
    LoginInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    PasskeyChallenge,
    PasskeyAssertionInput,
    PasskeyAttestationInput,
    PasskeyData,
} from './types';
