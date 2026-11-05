import { featureEnabled } from '../../config';
import { DemoLogin } from '@splicewire/beam-accounts';
import { Form, usePage } from '@inertiajs/react';
import InputError from '../../components/input-error';
import PasswordInput from '../../components/password-input';
import TextLink from '../../components/text-link';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Spinner } from '../../components/ui/spinner';



import PasskeyVerify from '../../components/passkey-verify';

import type { AuthEntryPageData } from '@splicewire/beam-resources/types/accounts-pages';
import { deferPasswordLoginForTwoFactor, isTwoFactorChallengeUrl, reportAuthenticatedLogin, startPasswordLogin } from './analytics';

// theme-entries-and-authoring STR-03: a sealed island (editor/registry.tsx), no longer the top-level
// Inertia page — these are FortifyServiceProvider's per-request props, still flowing exactly as
// before, read via usePage() instead of received as direct component props.
export default function Login() {
    const {
        status,
        canResetPassword,
        canRegister,
        demoAccounts = [],
        demoUserSearchUrl,
    } = usePage<AuthEntryPageData>().props;

    return (
        <>
            {featureEnabled('passkeys') && (<>
            <PasskeyVerify onAuthenticated={() => reportAuthenticatedLogin('passkey')} />
            </>)}

            <Form
                action="/login"
                method="post"
                onStart={startPasswordLogin}
                onSuccess={({ url }) => {
                    if (isTwoFactorChallengeUrl(url)) {
                        deferPasswordLoginForTwoFactor();
                    } else {
                        reportAuthenticatedLogin('password');
                    }
                }}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href="/forgot-password"
                                            className="ml-auto whitespace-nowrap text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {/* The Sign up affordance follows the SERVER registration policy
                            (`canRegister`, from `Features::enabled(Features::registration())` —
                            the same source the /register route reads), not a build-time client
                            feature flag. A closed-door host (ACCOUNT_REGISTRATION=closed) 404s
                            /register, so the link must not render there. Mirrors `canResetPassword`
                            above. */}
                        {canRegister && (<>
                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href="/register" tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div>
                        </>)}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    {status}
                </div>
            )}

            {/* S1: the demo sign-in is beam-accounts' one DemoLogin (research 22 addendum), so the session and token
                login pages share it. Both props are server-gated: the roster only in demo mode, the search URL only
                on a local host with ACCOUNT_DEMO_USER_PICKER on. A choice is a full GET of its signed login-as link. */}
            <DemoLogin className="mt-8" accounts={demoAccounts} searchUrl={demoUserSearchUrl} />
        </>
    );
}
