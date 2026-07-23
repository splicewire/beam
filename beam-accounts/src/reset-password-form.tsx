import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Label } from '@schemastud/ui';
import { useResetPassword } from './auth-hooks';
import { AuthError, PasswordInput } from './auth-fields';
import { errorMessage } from './utils';

export interface ResetPasswordFormProps {
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
export function ResetPasswordForm({ token, email, brand, onSuccess }: ResetPasswordFormProps) {
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [mismatch, setMismatch] = useState(false);
    const reset = useResetPassword();

    async function submit(event: FormEvent) {
        event.preventDefault();
        reset.reset();
        if (password !== confirmation) {
            setMismatch(true);
            return;
        }
        setMismatch(false);
        try {
            await reset.mutateAsync({
                token,
                email,
                password,
                password_confirmation: confirmation,
            });
            onSuccess?.();
        } catch {
            // Inline error below.
        }
    }

    return (
        <div className="flex w-full flex-col items-center gap-6">
            {brand}
            <div className="w-full space-y-4">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold">Set a new password</h1>
                    <p className="text-sm text-muted-foreground">Resetting the password for {email}.</p>
                </div>

                <form className="space-y-4" onSubmit={submit}>
                    <div className="space-y-2">
                        <Label htmlFor="reset-password">New password</Label>
                        <PasswordInput
                            id="reset-password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reset-password-confirm">Confirm new password</Label>
                        <PasswordInput
                            id="reset-password-confirm"
                            autoComplete="new-password"
                            required
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                        />
                    </div>

                    <AuthError
                        message={
                            mismatch
                                ? 'The passwords do not match.'
                                : reset.isError
                                  ? errorMessage(reset.error, 'This reset link is invalid or has expired.')
                                  : null
                        }
                    />

                    <Button type="submit" className="w-full" disabled={reset.isPending}>
                        {reset.isPending ? 'Resetting…' : 'Reset password'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
