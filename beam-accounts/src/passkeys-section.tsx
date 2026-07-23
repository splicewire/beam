import { KeyRound, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Input, Label } from '@schemastud/ui';
import { useDeletePasskey, usePasskeys, useRegisterPasskey } from './auth-hooks';
import { AuthError } from './auth-fields';
import { isWebAuthnSupported } from './webauthn';
import { errorMessage, formatDate } from './utils';

/**
 * The settings "Passkeys" surface (ticket 11): register a passkey from a trusted device, see
 * your registered passkeys by name with when each was last used, and delete one. Wired the same
 * injected-transport way as the tokens surface; runs the attestation ceremony on register.
 */
export function PasskeysSection() {
    const [supported] = useState(() => isWebAuthnSupported());
    const [name, setName] = useState('');
    const passkeys = usePasskeys();
    const register = useRegisterPasskey();
    const remove = useDeletePasskey();

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!name.trim()) return;
        register.mutate(name.trim(), { onSuccess: () => setName('') });
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">Passkeys</h2>
                <p className="text-sm text-muted-foreground">
                    Sign in without a password using a passkey saved on a trusted device.
                </p>
            </div>

            {supported ? (
                <form className="flex items-end gap-2" onSubmit={submit}>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="passkey-name">Add a passkey</Label>
                        <Input
                            id="passkey-name"
                            placeholder="e.g. My laptop"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={register.isPending || !name.trim()}>
                        <KeyRound className="size-4" aria-hidden />
                        {register.isPending ? 'Waiting…' : 'Register'}
                    </Button>
                </form>
            ) : (
                <p className="text-sm text-muted-foreground">
                    This browser or device doesn't support passkeys.
                </p>
            )}

            <AuthError
                message={register.isError ? errorMessage(register.error, 'Could not register the passkey.') : null}
            />

            <ul className="divide-y rounded-md border">
                {passkeys.isPending && <li className="p-3 text-sm text-muted-foreground">Loading…</li>}
                {passkeys.data?.length === 0 && !passkeys.isPending && (
                    <li className="p-3 text-sm text-muted-foreground">No passkeys registered yet.</li>
                )}
                {passkeys.data?.map((passkey) => (
                    <li key={passkey.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{passkey.name}</div>
                            <div className="text-xs text-muted-foreground">
                                Last used {formatDate(passkey.last_used_at)}
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${passkey.name}`}
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(passkey.id)}
                        >
                            <Trash2 className="size-4" aria-hidden />
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
