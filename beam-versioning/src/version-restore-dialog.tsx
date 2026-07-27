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
    return (
        <Dialog open={version !== null} onOpenChange={(next) => !next && onCancel()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Restore {version?.readable}?</DialogTitle>
                    <DialogDescription>
                        Your working copy is replaced with {version?.readable}'s content. A new
                        version is minted, so nothing is lost — you can roll back again.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button disabled={pending} onClick={onConfirm}>
                        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                        Restore
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
