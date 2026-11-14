import { useBeamMessages } from '../messages';
import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import Heading from './heading';
import PasskeyItem from './passkey-item';
import PasskeyRegistration from './passkey-register';
import type { Passkey } from '../types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    const messages = useBeamMessages();
    return (
        <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <KeyRound className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">{messages.t('splicewire-beam-inertia::messages.auth_no_passkeys_yet')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
                {messages.t('splicewire-beam-inertia::messages.auth_add_a_passkey_to_sign_in_without_a_password')}</p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const messages = useBeamMessages();
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(`/user/passkeys/${id}`, {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={messages.t('splicewire-beam-inertia::messages.auth_passkeys')}
                description={messages.t('splicewire-beam-inertia::messages.auth_manage_your_passkeys_for_passwordless_sign_in')}
            />

            <div className="overflow-hidden rounded-lg border border-border">
                {passkeys.length > 0 ? (
                    passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            <PasskeyRegistration onSuccess={handleRegisterSuccess} />
        </div>
    );
}
