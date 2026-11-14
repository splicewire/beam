import { useBeamMessages } from '../messages';
import { Form } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Heading from './heading';
import TwoFactorRecoveryCodes from './two-factor-recovery-codes';
import TwoFactorSetupModal from './two-factor-setup-modal';
import { Button } from './ui/button';
import { useTwoFactorAuth } from '../hooks/use-two-factor-auth';
export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props) {
    const messages = useBeamMessages();
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={messages.t('splicewire-beam-inertia::messages.auth_two_factor_authentication')}
                description={messages.t('splicewire-beam-inertia::messages.auth_manage_your_two_factor_authentication_settings')}
            />
            {twoFactorEnabled ? (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {messages.t('splicewire-beam-inertia::messages.auth_you_will_be_prompted_for_a_secure_random_pin_during_login_which_you_can_retrieve_from_the_totp_supported_appli')}</p>

                    <div className="relative inline">
                        <Form
                            action="/user/two-factor-authentication"
                            method="delete"
                        >
                            {({ processing }) => (
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    disabled={processing}
                                >
                                    {messages.t('splicewire-beam-inertia::messages.auth_disable_2fa')}</Button>
                            )}
                        </Form>
                    </div>

                    <TwoFactorRecoveryCodes
                        recoveryCodesList={recoveryCodesList}
                        fetchRecoveryCodes={fetchRecoveryCodes}
                        errors={errors}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {messages.t('splicewire-beam-inertia::messages.auth_when_you_enable_two_factor_authentication_you_will_be_prompted_for_a_secure_pin_during_login_this_pin_can_be_r')}</p>

                    <div>
                        {hasSetupData ? (
                            <Button onClick={() => setShowSetupModal(true)}>
                                <ShieldCheck />
                                {messages.t('splicewire-beam-inertia::messages.auth_continue_setup')}</Button>
                        ) : (
                            <Form
                                action="/user/two-factor-authentication"
                                method="post"
                                onSuccess={() => setShowSetupModal(true)}
                            >
                                {({ processing }) => (
                                    <Button type="submit" disabled={processing}>
                                        {messages.t('splicewire-beam-inertia::messages.auth_enable_2fa')}</Button>
                                )}
                            </Form>
                        )}
                    </div>
                </div>
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </div>
    );
}
