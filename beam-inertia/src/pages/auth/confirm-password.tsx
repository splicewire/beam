import { useBeamMessages } from '../../messages';
import { featureEnabled } from '../../config';
import { Form } from '@inertiajs/react';
import InputError from '../../components/input-error';
import PasswordInput from '../../components/password-input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Spinner } from '../../components/ui/spinner';

import PasskeyVerify from '../../components/passkey-verify';


// theme-entries-and-authoring STR-03: a sealed island (editor/registry.tsx), no longer the top-level
// Inertia page.
export default function ConfirmPassword() {
    const messages = useBeamMessages();
    return (
        <>
            {featureEnabled('passkeys') && (<>
            <PasskeyVerify
                routes={{
                    options: {
                        method: 'get',
                        url: '/passkeys/confirm/options',
                    },
                    submit: { method: 'post', url: '/passkeys/confirm' },
                }}
                label={messages.t('splicewire-beam-inertia::messages.auth_confirm_with_passkey')}
                loadingLabel={messages.t('splicewire-beam-inertia::messages.auth_confirming')}
                separator={messages.t('splicewire-beam-inertia::messages.auth_or_confirm_with_password')}
            />
            </>)}

            <Form
                action="/user/confirm-password"
                method="post"
                resetOnSuccess={['password']}
            >
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{messages.t('splicewire-beam-inertia::messages.auth_password')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder={messages.t('splicewire-beam-inertia::messages.auth_password')}
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                {messages.t('splicewire-beam-inertia::messages.auth_confirm_password')}</Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}
