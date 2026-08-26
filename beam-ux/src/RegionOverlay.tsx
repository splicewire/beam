import { X } from 'lucide-react';
import { Badge, cn } from '@schemastud/ui';
import { KIND_ICON } from './kindIcon';
import { RegionEditorBody } from './RegionEditorBody';
import type { RegionEditorProps } from './RegionInspector';

/**
 * The floating in-context region editor — the OVERLAY-placement variant of {@link RegionInspector}. A
 * self-managing popover hovering over the live page canvas, with a close button. Same kind-driven body
 * as the inspector; only the chrome (shadow, ring, dismiss) differs.
 */
export function RegionOverlay({
    region,
    schema,
    body,
    onChange,
    onSave,
    saving,
    onClose,
}: RegionEditorProps & { onClose: () => void }) {
    const Icon = KIND_ICON[region.kind];
    return (
        <div className={cn('rounded-lg border bg-card shadow-2xl ring-1 ring-primary/20')}>
            <div className="flex items-start gap-2 border-b px-4 py-3">
                <Icon className="mt-0.5 size-4 flex-none text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{region.label}</span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted"
                            title="Dismiss overlay"
                            aria-label="Dismiss overlay"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {region.recordLabel ?? region.recordId}
                        </span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                            {region.kind}
                        </Badge>
                    </div>
                </div>
            </div>
            <div className="p-4">
                <RegionEditorBody
                    region={region}
                    schema={schema}
                    body={body}
                    onChange={onChange}
                    onSave={onSave}
                    saving={saving}
                />
                <p className="mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    {region.note}
                </p>
            </div>
        </div>
    );
}
