import { useBeamMessages } from '../messages';
import type { UrlMethodPair } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import InputError from './input-error';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Spinner } from './ui/spinner';

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
    onAuthenticated?: () => void;
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
    onAuthenticated,
}: Props = {}) {
    const messages = useBeamMessages();
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes && {
            routes: {
                options: routes.options.url,
                submit: routes.submit.url,
            },
        }),
        onSuccess: (response) => {
            onAuthenticated?.();
            router.visit(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <>
            <div className="grid gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={verify}
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner /> : <KeyRound className="h-4 w-4" />}
                    {isLoading
                        ? (loadingLabel ?? messages.t('splicewire-beam-inertia::messages.auth_authenticating'))
                        : (label ?? messages.t('splicewire-beam-inertia::messages.auth_sign_in_with_a_passkey'))}
                </Button>
                {error && (
                    <InputError message={error} className="text-center" />
                )}
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        {separator ?? messages.t('splicewire-beam-inertia::messages.auth_or_continue_with_email')}
                    </span>
                </div>
            </div>
        </>
    );
}
