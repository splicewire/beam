import { useBeamMessages } from '../messages';
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import type { Passkey } from "../types/auth";

type Props = {
  passkey: Passkey;
  onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const messages = useBeamMessages();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(passkey.id, () => setIsDeleting(false));
  };

  return (
    <div className="flex items-center justify-between border-b p-4 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <p className="font-medium tracking-tight">{passkey.name}</p>
            {passkey.authenticator && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase ring-1 ring-border ring-inset">
                {passkey.authenticator}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {messages.t('splicewire-beam-inertia::messages.auth_passkey_added', { date: passkey.createdAtDiff })}
            {passkey.lastUsedAtDiff && (
              <>
                <span className="mx-1 text-muted-foreground/50">/</span>
                {messages.t('splicewire-beam-inertia::messages.auth_passkey_last_used', { date: passkey.lastUsedAtDiff })}
              </>
            )}
          </p>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{messages.t('splicewire-beam-inertia::messages.auth_remove')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{messages.t('splicewire-beam-inertia::messages.auth_remove_passkey')}</DialogTitle>
          <DialogDescription>
            {messages.t('splicewire-beam-inertia::messages.auth_passkey_remove_confirmation', { name: passkey.name })}
          </DialogDescription>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="secondary">{messages.t('splicewire-beam-inertia::messages.auth_cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? messages.t('splicewire-beam-inertia::messages.auth_removing') : messages.t('splicewire-beam-inertia::messages.auth_remove_passkey')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
