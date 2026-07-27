import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { Button, Input } from '@schemastud/ui';
import { useRestoreVersion, useSaveVersion, useVersions } from './hooks';
import { useNotify, useVersionsServices } from './provider';
import { VersionRestoreDialog } from './version-restore-dialog';
import { VersionsList } from './versions-list';
import type { VersionData } from './types';

/**
 * The batteries-included version-history panel: wires the package's own react-query hooks to the
 * {@see VersionsList} + {@see VersionRestoreDialog}, plus a "Save version" affordance. This is the
 * one-line mount a host reaches for — supply a {@see VersionsProvider} with a transport `client`
 * and drop `<VersionsPanel />` into a drawer, sheet, or admin panel. The composition drawer and the
 * embeds admin surface are both thin wrappers over this.
 *
 * Feedback rides the injected `notify` (a console default when the host omits it) — no toast is
 * ever bundled. `disabled` (a view-only user) hides Save and disables Restore.
 */
export function VersionsPanel({
    disabled = false,
    showSaveButton = true,
}: {
    disabled?: boolean;
    showSaveButton?: boolean;
}) {
    const { renderVersionMeta, onSaved, onRestored } = useVersionsServices();
    const notify = useNotify();
    const versions = useVersions();
    const save = useSaveVersion();
    const restore = useRestoreVersion();

    const [confirming, setConfirming] = useState<VersionData | null>(null);
    const [labelling, setLabelling] = useState(false);
    const [label, setLabel] = useState('');

    function handleSave() {
        // An explicit, optionally-labelled snapshot (PRD story 7) — the label the host typed rides
        // through to the versions endpoint; an empty label mints a bare `v{n}`.
        save.mutate(
            { label: label.trim() || undefined },
            {
                onSuccess: (v) => {
                    notify({ type: 'success', message: `Saved ${v.readable}` });
                    onSaved?.(v);
                    setLabelling(false);
                    setLabel('');
                },
                onError: () => notify({ type: 'error', message: 'Save version failed' }),
            },
        );
    }

    function handleRestore() {
        if (!confirming) return;
        const target = confirming;
        restore.mutate(
            { ref: target.id },
            {
                onSuccess: (v) => {
                    notify({
                        type: 'success',
                        message: `Restored ${target.readable} — now ${v.readable}`,
                    });
                    onRestored?.(v);
                    setConfirming(null);
                },
                onError: () => notify({ type: 'error', message: 'Restore failed' }),
            },
        );
    }

    return (
        <div className="flex-1 space-y-4 overflow-y-auto">
            {showSaveButton &&
                !disabled &&
                (labelling ? (
                    <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                    >
                        <Input
                            autoFocus
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Optional label (e.g. before the rewrite)"
                            aria-label="Version label"
                            className="h-8 text-sm"
                        />
                        <Button type="submit" size="sm" disabled={save.isPending}>
                            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                            Save
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={save.isPending}
                            onClick={() => {
                                setLabelling(false);
                                setLabel('');
                            }}
                        >
                            Cancel
                        </Button>
                    </form>
                ) : (
                    <Button
                        className="w-full"
                        size="sm"
                        onClick={() => setLabelling(true)}
                    >
                        <Save /> Save version
                    </Button>
                ))}

            <VersionsList
                versions={versions.data}
                isLoading={versions.isPending}
                isError={versions.isError}
                disabled={disabled || restore.isPending}
                onRestore={setConfirming}
                renderVersionMeta={renderVersionMeta}
            />

            <VersionRestoreDialog
                version={confirming}
                pending={restore.isPending}
                onConfirm={handleRestore}
                onCancel={() => setConfirming(null)}
            />
        </div>
    );
}
