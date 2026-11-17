import { Check, KeyRound, Pencil, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Label } from "@schemastud/ui";
import {
  useDeletePasskey,
  usePasskeys,
  useRegisterPasskey,
  useRenamePasskey,
} from "./auth-hooks";
import { useAuthServices } from "./auth-provider";
import { AuthError } from "./auth-fields";
import { isWebAuthnSupported } from "./webauthn";
import { errorMessage, formatDate } from "./utils";
import { useBeamAccountsMessages } from "./messages";

/**
 * The settings "Passkeys" surface (ticket 11; rename + registered-date added in admin-redesign
 * ticket 03): register a passkey from a trusted device, see your registered passkeys by name with
 * when each was added + last used, rename one inline, and delete one. Wired the same
 * injected-transport way as the tokens surface; runs the attestation ceremony on register. Rename
 * lights up only when the host supplies a `passkey.rename` transport.
 */
export function PasskeysSection({
  showHeader = true,
}: {
  /** False when the host frames the section under its own heading and copy (TOWER-05: no duplicate "Passkeys"). */
  showHeader?: boolean;
} = {}) {
  const m = useBeamAccountsMessages();
  const [supported] = useState(() => isWebAuthnSupported());
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const { client } = useAuthServices();
  const canRename = Boolean(client.passkey?.rename);
  const passkeys = usePasskeys();
  const register = useRegisterPasskey();
  const rename = useRenamePasskey();
  const remove = useDeletePasskey();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    register.mutate(name.trim(), { onSuccess: () => setName("") });
  }

  function startEditing(id: number, current: string) {
    setEditingId(id);
    setDraftName(current);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftName("");
  }

  function saveEditing(id: number) {
    const next = draftName.trim();
    if (!next) return;
    rename.mutate({ id, name: next }, { onSuccess: () => cancelEditing() });
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{m.t('splicewire-beam-accounts::messages.passkeys_heading')}</h2>
          <p className="text-sm text-muted-foreground">
            {m.t('splicewire-beam-accounts::messages.passkeys_description')}
          </p>
        </div>
      )}

      {supported ? (
        <form className="flex items-end gap-2" onSubmit={submit}>
          <div className="flex-1 space-y-2">
            <Label htmlFor="passkey-name">{m.t('splicewire-beam-accounts::messages.passkeys_add')}</Label>
            <Input
              id="passkey-name"
              placeholder={m.t('splicewire-beam-accounts::messages.passkeys_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={register.isPending || !name.trim()}>
            <KeyRound className="size-4" aria-hidden />
            {register.isPending ? m.t('splicewire-beam-accounts::messages.passkeys_waiting') : m.t('splicewire-beam-accounts::messages.passkeys_register')}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          {m.t('splicewire-beam-accounts::messages.passkeys_unsupported')}
        </p>
      )}

      <AuthError
        message={
          register.isError
            ? errorMessage(register.error, m.t('splicewire-beam-accounts::messages.passkeys_register_failed'), m)
            : null
        }
      />
      <AuthError
        message={
          rename.isError
            ? errorMessage(rename.error, m.t('splicewire-beam-accounts::messages.passkeys_rename_failed'), m)
            : null
        }
      />

      <ul className="divide-y rounded-md border">
        {passkeys.isPending && (
          <li className="p-3 text-sm text-muted-foreground">{m.t('splicewire-beam-accounts::messages.passkeys_loading')}</li>
        )}
        {passkeys.data?.length === 0 && !passkeys.isPending && (
          <li className="p-3 text-sm text-muted-foreground">
            {m.t('splicewire-beam-accounts::messages.passkeys_empty')}
          </li>
        )}
        {passkeys.data?.map((passkey) => {
          const editing = editingId === passkey.id;
          return (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              {editing ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEditing(passkey.id);
                  }}
                >
                  <Input
                    aria-label={m.t('splicewire-beam-accounts::messages.passkeys_rename_named', { name: passkey.name })}
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEditing();
                    }}
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label={m.t('splicewire-beam-accounts::messages.passkeys_save_name')}
                    disabled={rename.isPending || !draftName.trim()}
                  >
                    <Check className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={m.t('splicewire-beam-accounts::messages.passkeys_cancel_rename')}
                    disabled={rename.isPending}
                    onClick={cancelEditing}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </form>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {passkey.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.t('splicewire-beam-accounts::messages.passkeys_dates', { added: formatDate(passkey.createdAt), used: formatDate(passkey.lastUsedAt) })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canRename && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={m.t('splicewire-beam-accounts::messages.passkeys_rename_named', { name: passkey.name })}
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
                      aria-label={m.t('splicewire-beam-accounts::messages.passkeys_delete_named', { name: passkey.name })}
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
