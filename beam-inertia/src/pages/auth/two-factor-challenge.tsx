import { AuthMessage } from '../../components/auth-message';
import { useBeamMessages } from '../../messages';
import { Form, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import InputError from '../../components/input-error';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '../../components/ui/input-otp';
import { OTP_MAX_LENGTH } from '../../hooks/use-two-factor-auth';
import { completePendingLogin } from './analytics';
// theme-entries-and-authoring STR-03: a sealed island (editor/registry.tsx), no longer the top-level
// Inertia page. Its dynamic title/description toggle (below) is session-state-driven, not editorial
// copy, so it keeps calling setLayoutProps itself rather than going through the composable tree.
export default function TwoFactorChallenge() {
    const messages = useBeamMessages();
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: messages.t('splicewire-beam-inertia::messages.auth_recovery_code'),
                description:
                    messages.t('splicewire-beam-inertia::messages.auth_please_confirm_access_to_your_account_by_entering_one_of_your_emergency_recovery_codes'),
                toggleText: messages.t('splicewire-beam-inertia::messages.auth_login_using_an_authentication_code_lowercase'),
            };
        }

        return {
            title: messages.t('splicewire-beam-inertia::messages.auth_authentication_code'),
            description:
                messages.t('splicewire-beam-inertia::messages.auth_enter_the_authentication_code_provided_by_your_authenticator_application'),
            toggleText: messages.t('splicewire-beam-inertia::messages.auth_login_using_a_recovery_code_lowercase'),
        };
    }, [showRecoveryInput, messages]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <div className="space-y-6">
                <Form
                    action="/two-factor-challenge"
                    method="post"
                    onSuccess={completePendingLogin}
                    className="space-y-4"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <>
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder={messages.t('splicewire-beam-inertia::messages.auth_enter_recovery_code')}
                                        autoFocus={showRecoveryInput}
                                        required
                                    />
                                    <InputError
                                        message={errors.recovery_code}
                                    />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {messages.t('splicewire-beam-inertia::messages.auth_continue')}</Button>

                            <div className="text-center text-sm text-muted-foreground">
                                <AuthMessage text={messages.t('splicewire-beam-inertia::messages.auth_recovery_mode_prompt', { action: '\uFFFC0\uFFFC' })} parts={[<button
                                    type="button"
                                    className="cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                >
                                    {authConfigContent.toggleText}
                                </button>]} />
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
