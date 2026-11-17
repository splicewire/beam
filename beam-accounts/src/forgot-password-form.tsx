import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Label } from '@schemastud/ui';
import { useRequestPasswordReset } from './auth-hooks';
import { AuthError } from './auth-fields';
import { errorMessage } from './utils';
import { useBeamAccountsMessages } from './messages';

export interface ForgotPasswordFormProps {
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
export function ForgotPasswordForm({ brand, onBack }: ForgotPasswordFormProps) {
    const m = useBeamAccountsMessages();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const request = useRequestPasswordReset();

    async function submit(event: FormEvent) {
        event.preventDefault();
        request.reset();
        try {
            await request.mutateAsync({ email });
            setSent(true);
        } catch {
            // Inline error below.
        }
    }

    return (
        <div className="flex w-full flex-col items-center gap-6">
            {brand}
            <div className="w-full space-y-4">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold">{m.t('splicewire-beam-accounts::messages.auth_forgot_password')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-accounts::messages.forgot_description')}
                    </p>
                </div>

                {sent ? (
                    <p role="status" className="text-sm">
                        {m.t('splicewire-beam-accounts::messages.forgot_sent')}
                    </p>
                ) : (
                    <form className="space-y-4" onSubmit={submit}>
                        <div className="space-y-2">
                            <Label htmlFor="forgot-email">{m.t('splicewire-beam-accounts::messages.auth_email')}</Label>
                            <input
                                id="forgot-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <AuthError
                            message={request.isError ? errorMessage(request.error, m.t('splicewire-beam-accounts::messages.forgot_failed'), m) : null}
                        />

                        <Button type="submit" className="w-full" disabled={request.isPending}>
                            {request.isPending ? m.t('splicewire-beam-accounts::messages.forgot_sending') : m.t('splicewire-beam-accounts::messages.forgot_submit')}
                        </Button>
                    </form>
                )}

                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                        {m.t('splicewire-beam-accounts::messages.forgot_back')}
                    </button>
                )}
            </div>
        </div>
    );
}
