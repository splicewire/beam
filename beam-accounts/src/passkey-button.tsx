import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@schemastud/ui';
import { usePasskey } from './auth-hooks';
import { AuthError } from './auth-fields';
import { isWebAuthnSupported } from './webauthn';
import { errorMessage } from './utils';

export interface PasskeyButtonProps<TResult = unknown> {
    /** Fires with the host's auth-result payload after a successful passkey sign-in. */
    onSuccess: (result: TResult) => void;
    label?: string;
}

/**
 * "Sign in with a passkey" — runs the WebAuthn assertion ceremony and completes sign-in exactly
 * like password login. It renders NOTHING when the device/browser can't do WebAuthn, so a user
 * is never offered something that can't work; a cancelled/failed ceremony surfaces inline.
 */
export function PasskeyButton<TResult = unknown>({ onSuccess, label }: PasskeyButtonProps<TResult>) {
    // Support is a device fact, evaluated once — a re-render can't change it.
    const [supported] = useState(() => isWebAuthnSupported());
    const passkey = usePasskey<TResult>();

    if (!supported) return null;

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={passkey.isPending}
                onClick={() => passkey.mutate(undefined, { onSuccess: (result) => onSuccess(result) })}
            >
                <KeyRound className="size-4" aria-hidden />
                {passkey.isPending ? 'Waiting for passkey…' : (label ?? 'Sign in with a passkey')}
            </Button>
            <AuthError
                message={passkey.isError ? errorMessage(passkey.error, 'Passkey verification was cancelled.') : null}
            />
        </div>
    );
}
