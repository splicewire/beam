import { AlertTriangle, Check, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, Button } from '@schemastud/ui';
import { relativeTime } from './relative-time';
import type { VersionData } from './types';
import { useBeamVersioningMessages } from './messages';
import { systemLabel } from './system-label';

function VersionRow<TVersion extends VersionData>({
    version,
    onRestore,
    disabled,
    renderMeta,
}: {
    version: TVersion;
    onRestore: (version: TVersion) => void;
    disabled: boolean;
    renderMeta?: (version: TVersion) => ReactNode;
}) {
    const m = useBeamVersioningMessages();
    return (
        <div className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{version.readable}</span>
                    {version.isHead && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                            <Check className="size-3" /> {m.t('splicewire-beam-versioning::messages.head')}
                        </Badge>
                    )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {version.label && <span className="truncate">{systemLabel(version.label, m)}</span>}
                    {version.label && version.createdAt && <span>·</span>}
                    {version.createdAt && <span>{relativeTime(version.createdAt, m)}</span>}
                </div>
            </div>
            <div className="flex items-center gap-1">
                {renderMeta?.(version)}
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled || version.isHead}
                    aria-label={
                        version.isHead
                            ? m.t('splicewire-beam-versioning::messages.current_version_aria', { version: version.readable })
                            : m.t('splicewire-beam-versioning::messages.restore_named', { version: version.readable })
                    }
                    title={
                        version.isHead
                            ? m.t('splicewire-beam-versioning::messages.already_current')
                            : m.t('splicewire-beam-versioning::messages.restore_named', { version: version.readable })
                    }
                    onClick={() => onRestore(version)}
                >
                    <RotateCcw /> {m.t('splicewire-beam-versioning::messages.restore')}
                </Button>
            </div>
        </div>
    );
}

/**
 * The version-history list — the record-agnostic heart of the surface, extracted from the
 * composition VersionsDrawer. Renders each version as a row (readable handle, HEAD badge, label,
 * relative timestamp, optional injected host chrome) and degrades into sensible empty / loading /
 * error states. It owns no data logic and no feedback: the caller drives it with a resolved
 * `versions` array + the wiring hooks, and confirms restores through {@see VersionRestoreDialog}.
 */
export function VersionsList<TVersion extends VersionData = VersionData>({
    versions,
    isLoading = false,
    isError = false,
    disabled = false,
    onRestore,
    renderVersionMeta,
    emptyMessage,
    errorMessage,
}: {
    versions: TVersion[] | undefined;
    isLoading?: boolean;
    isError?: boolean;
    /** Gate mutations (a view-only user gets a read-only list). */
    disabled?: boolean;
    onRestore: (version: TVersion) => void;
    renderVersionMeta?: (version: TVersion) => ReactNode;
    emptyMessage?: string;
    errorMessage?: string;
}) {
    const m = useBeamVersioningMessages();
    if (isLoading) {
        return <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-versioning::messages.loading')}</p>;
    }

    if (isError) {
        return (
            <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" /> {errorMessage ?? m.t('splicewire-beam-versioning::messages.load_failed')}
            </p>
        );
    }

    if (!versions || versions.length === 0) {
        return <p className="text-sm text-muted-foreground">{emptyMessage ?? m.t('splicewire-beam-versioning::messages.empty')}</p>;
    }

    return (
        <div className="space-y-2">
            {versions.map((version) => (
                <VersionRow
                    key={version.id}
                    version={version}
                    disabled={disabled}
                    onRestore={onRestore}
                    renderMeta={renderVersionMeta}
                />
            ))}
        </div>
    );
}
