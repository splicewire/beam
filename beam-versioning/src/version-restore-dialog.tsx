import { Loader2, RotateCcw } from 'lucide-react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@schemastud/ui';
import type { VersionData } from './types';
import { useBeamVersioningMessages } from './messages';

/**
 * Confirm-before-restore dialog, extracted from the composition VersionsDrawer. Carries NO
 * `sonner`/toast dependency — success/error feedback is the caller's concern via the injected
 * `notify`. `pending` disables the confirm and shows a spinner so a slow roll-forward reads as
 * in-flight, not stuck.
 */
export function VersionRestoreDialog<TVersion extends VersionData = VersionData>({
    version,
    pending,
    onConfirm,
    onCancel,
}: {
    /** The version being restored, or null when the dialog is closed. */
    version: TVersion | null;
    pending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const m = useBeamVersioningMessages();
    return (
        <Dialog open={version !== null} onOpenChange={(next) => !next && onCancel()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{m.t('splicewire-beam-versioning::messages.restore_title', { version: version?.readable ?? '' })}</DialogTitle>
                    <DialogDescription>
                        {m.t('splicewire-beam-versioning::messages.restore_description', { version: version?.readable ?? '' })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        {m.t('splicewire-beam-versioning::messages.cancel')}
                    </Button>
                    <Button disabled={pending} onClick={onConfirm}>
                        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                        {m.t('splicewire-beam-versioning::messages.restore')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
