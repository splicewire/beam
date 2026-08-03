import { Badge, cn } from '@schemastud/ui';
import type { SchemaNode } from '@schemastud/seam';
import { KIND_ICON } from './kindIcon';
import { RegionEditorBody } from './RegionEditorBody';
import type { Region } from './types';

/** Shared props for the region editor surfaces (inspector + overlay). */
export interface RegionEditorProps {
    region: Region;
    schema: SchemaNode | null;
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
    onSave: () => void;
    saving?: boolean;
}

/**
 * The docked region-editor panel — the always-present right-hand inspector column. Header carries the
 * kind icon + label + record mono + a neutral kind badge (residency/facade chips deliberately dropped:
 * both resolve BELOW the surface); body is the kind-driven editor.
 */
export function RegionInspector({
    region,
    schema,
    body,
    onChange,
    onSave,
    saving,
}: RegionEditorProps) {
    const Icon = KIND_ICON[region.kind];
    return (
        <div className="rounded-lg border bg-card">
            <div className="flex items-start gap-2 border-b px-4 py-3">
                <Icon className="mt-0.5 size-4 flex-none text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold">{region.label}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {region.record}
                        </span>
                        <Badge variant="secondary" className={cn('font-mono text-[10px]')}>
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
