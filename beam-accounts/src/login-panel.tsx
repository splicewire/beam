import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@schemastud/ui';
import { useLogin } from './auth-hooks';
import { AuthError, PasswordInput } from './auth-fields';
import { errorMessage } from './utils';

export interface LoginPanelProps<TResult = unknown> {
    /** The host brand lockup, injected (ADR-0092: brand stays in the app). Rendered above the card. */
    brand?: ReactNode;
    /** Fires with the host's auth-result payload after a successful sign-in. */
    onSuccess: (result: TResult) => void;
    title?: string;
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
export function LoginPanel<TResult = unknown>({
    brand,
    onSuccess,
    title = 'Sign in to Splicewire',
    description,
    showPasskeySlot = false,
    passkeySlot,
    showRemember = false,
    showForgotLink = false,
    onForgot,
    footer,
}: LoginPanelProps<TResult>) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const login = useLogin();

    async function submit(event: FormEvent) {
        event.preventDefault();
        login.reset();
        try {
            const result = (await login.mutateAsync({
                email,
                password,
                ...(showRemember ? { remember } : {}),
            })) as TResult;
            onSuccess(result);
        } catch {
            // Error surfaced inline below via `login.error`.
        }
    }

    return (
        <div className="flex w-full flex-col items-center gap-6">
            {brand}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                    {showPasskeySlot && passkeySlot && (
                        <>
                            <div>{passkeySlot}</div>
                            <div className="flex items-center gap-3" aria-hidden>
                                <span className="h-px flex-1 bg-border" />
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Or continue with email
                                </span>
                                <span className="h-px flex-1 bg-border" />
                            </div>
                        </>
                    )}

                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">Password</Label>
                                {showForgotLink && (
                                    <button
                                        type="button"
                                        onClick={onForgot}
                                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </button>
                                )}
                            </div>
                            <PasswordInput
                                id="login-password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {showRemember && (
                            <label htmlFor="login-remember" className="flex items-center gap-2 text-sm">
                                <input
                                    id="login-remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="size-4 rounded border-input"
                                />
                                Remember me
                            </label>
                        )}

                        <AuthError message={login.isError ? errorMessage(login.error, 'Invalid email or password.') : null} />

                        <Button type="submit" className="w-full" disabled={login.isPending}>
                            {login.isPending ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>

                    {footer}
                </CardContent>
            </Card>
        </div>
    );
}
