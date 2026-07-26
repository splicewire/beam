import { Check, KeyRound, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Input, Label } from '@schemastud/ui';
import {
    useDeletePasskey,
    usePasskeys,
    useRegisterPasskey,
    useRenamePasskey,
} from './auth-hooks';
import { useAuthServices } from './auth-provider';
import { AuthError } from './auth-fields';
import { isWebAuthnSupported } from './webauthn';
import { errorMessage, formatDate } from './utils';

/**
 * The settings "Passkeys" surface (ticket 11; rename + registered-date added in admin-redesign
 * ticket 03): register a passkey from a trusted device, see your registered passkeys by name with
 * when each was added + last used, rename one inline, and delete one. Wired the same
 * injected-transport way as the tokens surface; runs the attestation ceremony on register. Rename
 * lights up only when the host supplies a `passkey.rename` transport.
 */
export function PasskeysSection() {
    const [supported] = useState(() => isWebAuthnSupported());
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draftName, setDraftName] = useState('');
    const { client } = useAuthServices();
    const canRename = Boolean(client.passkey?.rename);
    const passkeys = usePasskeys();
    const register = useRegisterPasskey();
    const rename = useRenamePasskey();
    const remove = useDeletePasskey();

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!name.trim()) return;
        register.mutate(name.trim(), { onSuccess: () => setName('') });
    }

    function startEditing(id: number, current: string) {
        setEditingId(id);
        setDraftName(current);
    }

    function cancelEditing() {
        setEditingId(null);
        setDraftName('');
    }

    function saveEditing(id: number) {
        const next = draftName.trim();
        if (!next) return;
        rename.mutate({ id, name: next }, { onSuccess: () => cancelEditing() });
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
            <AuthError
                message={rename.isError ? errorMessage(rename.error, 'Could not rename the passkey.') : null}
            />

            <ul className="divide-y rounded-md border">
                {passkeys.isPending && <li className="p-3 text-sm text-muted-foreground">Loading…</li>}
                {passkeys.data?.length === 0 && !passkeys.isPending && (
                    <li className="p-3 text-sm text-muted-foreground">No passkeys registered yet.</li>
                )}
                {passkeys.data?.map((passkey) => {
                    const editing = editingId === passkey.id;
                    return (
                        <li key={passkey.id} className="flex items-center justify-between gap-3 p-3">
                            {editing ? (
                                <form
                                    className="flex flex-1 items-center gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        saveEditing(passkey.id);
                                    }}
                                >
                                    <Input
                                        aria-label={`Rename ${passkey.name}`}
                                        autoFocus
                                        value={draftName}
                                        onChange={(e) => setDraftName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') cancelEditing();
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Save name"
                                        disabled={rename.isPending || !draftName.trim()}
                                    >
                                        <Check className="size-4" aria-hidden />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Cancel rename"
                                        disabled={rename.isPending}
                                        onClick={cancelEditing}
                                    >
                                        <X className="size-4" aria-hidden />
                                    </Button>
                                </form>
                            ) : (
                                <>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{passkey.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Added {formatDate(passkey.created_at)} · Last used{' '}
                                            {formatDate(passkey.last_used_at)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {canRename && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Rename ${passkey.name}`}
                                                disabled={remove.isPending}
                                                onClick={() => startEditing(passkey.id, passkey.name)}
                                            >
                                                <Pencil className="size-4" aria-hidden />
                                            </Button>
                                        )}
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
                                    </div>
                                </>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
