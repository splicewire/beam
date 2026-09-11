import { lazy, Suspense } from 'react';
import { resolveBeamPage } from '../pages';
import { featureEnabled } from '../config';
// Component registry for the visual editor's OPAQUE ISLANDS. A tree node whose `name` is a registered key
// (PascalCase) renders the REAL designed component (sealed block: select / reorder / delete, no drill-in)
// instead of an intrinsic element. Host CONFIG only — the "is this an island" test lives in the package
// canvas (`isIsland(config, name)`); this file just supplies the map. A fresh host registers its own
// designed sections here.
import type { ComponentType } from 'react';















import { DemoFeatureRow, DemoHero } from './islands';

export function defaultComponents(): Record<
    string,
    ComponentType<Record<string, unknown>>
> { return {
    DemoHero,
    DemoFeatureRow,
    // theme-entries-and-authoring STR-03: the 7 promoted auth pages' real Fortify-bound forms, sealed
    // (position/delete-only in the visual editor, never decomposed) — the files themselves are
    // UNCHANGED in location/content (chisel's scaffold-time feature-toggle operates on these exact
    // paths; moving them would require updating the starter's own chisel-paths.php).
    AuthLogin: Login,
    
    ...(featureEnabled('registration') ? { AuthRegister: Register } : {}),
    
    AuthForgotPassword: ForgotPassword,
    AuthResetPassword: ResetPassword,
    
    ...(featureEnabled('password-confirmation') ? { AuthConfirmPassword: ConfirmPassword } : {}),
    
    
    ...(featureEnabled('2fa') ? { AuthTwoFactorChallenge: TwoFactorChallenge } : {}),
    
    
    ...(featureEnabled('email-verification') ? { AuthVerifyEmail: VerifyEmail } : {}),
    
}; }

const LoginPage = lazy(async () => ({ default: await resolveBeamPage('auth/login') }));
function Login() { return <Suspense fallback={null}><LoginPage /></Suspense>; }

const RegisterPage = lazy(async () => ({ default: await resolveBeamPage('auth/register') }));
function Register() { return <Suspense fallback={null}><RegisterPage /></Suspense>; }

const ForgotPasswordPage = lazy(async () => ({ default: await resolveBeamPage('auth/forgot-password') }));
function ForgotPassword() { return <Suspense fallback={null}><ForgotPasswordPage /></Suspense>; }

const ResetPasswordPage = lazy(async () => ({ default: await resolveBeamPage('auth/reset-password') }));
function ResetPassword() { return <Suspense fallback={null}><ResetPasswordPage /></Suspense>; }

const ConfirmPasswordPage = lazy(async () => ({ default: await resolveBeamPage('auth/confirm-password') }));
function ConfirmPassword() { return <Suspense fallback={null}><ConfirmPasswordPage /></Suspense>; }

const TwoFactorChallengePage = lazy(async () => ({ default: await resolveBeamPage('auth/two-factor-challenge') }));
function TwoFactorChallenge() { return <Suspense fallback={null}><TwoFactorChallengePage /></Suspense>; }

const VerifyEmailPage = lazy(async () => ({ default: await resolveBeamPage('auth/verify-email') }));
function VerifyEmail() { return <Suspense fallback={null}><VerifyEmailPage /></Suspense>; }
