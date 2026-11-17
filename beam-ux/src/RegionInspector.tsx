import type { ReactNode } from 'react';
import { Badge, cn } from '@schemastud/ui';
import type { SchemaNode } from '@schemastud/seam';
import { KIND_ICON } from './kindIcon';
import { RegionEditorBody } from './RegionEditorBody';
import type { Region } from './types';
import type { EntryBody } from './types';
import { useBeamUxMessages } from './messages.js';

export interface RegionPreview {
    id: string;
    title: string;
    href: string | null;
}

/** Shared props for the region editor surfaces (inspector + overlay). */
export interface RegionEditorProps {
    region: Region;
    schema: SchemaNode | null;
    body: EntryBody;
    onChange: (body: EntryBody) => void;
    onSave: () => void;
    /**
     * Drop the in-flight edit buffer, returning the editor to the last persisted body. Optional
     * because the surfaces are also mounted by hosts that own the buffer themselves and have no
     * separate draft to discard; the control renders disabled when it is omitted rather than
     * rendering an affordance that does nothing.
     */
    onDiscard?: () => void;
    previews?: RegionPreview[];
    previewState?: 'loading' | 'ready' | 'unavailable';
    saving?: boolean;
    saveLabel?: string;
    saveDisabled?: boolean;
    editorDisabled?: boolean;
    publicationControls?: ReactNode;
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
    onDiscard,
    saving,
    saveLabel,
    saveDisabled,
    editorDisabled,
    publicationControls,
    previews = [],
    previewState = 'unavailable',
}: RegionEditorProps) {
    const m = useBeamUxMessages();
    const Icon = KIND_ICON[region.kind];
    return (
        <div className="rounded-lg border bg-card">
            <div className="flex items-start gap-2 border-b px-4 py-3">
                <Icon className="mt-0.5 size-4 flex-none text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold">{region.label}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {region.recordLabel ?? region.recordId}
                        </span>
                        <Badge variant="secondary" className={cn('font-mono text-[10px]')}>
                            {region.kind}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    {region.url ? (
                        <a href={region.url} target="_blank" rel="noopener noreferrer">
                            {m.t('splicewire-beam-ux::messages.inspector_view')}
                        </a>
                    ) : (
                        <span className="text-muted-foreground">{m.t('splicewire-beam-ux::messages.inspector_view_unavailable')}</span>
                    )}
                    {previewState === 'loading' ? (
                        <span>{m.t('splicewire-beam-ux::messages.inspector_preview_loading')}</span>
                    ) : previewState === 'unavailable' ? (
                        <span>{m.t('splicewire-beam-ux::messages.inspector_preview_unavailable')}</span>
                    ) : previews.length === 0 ? (
                        <span>{m.t('splicewire-beam-ux::messages.inspector_no_open_release')}</span>
                    ) : (
                        previews.map((preview) =>
                            preview.href ? (
                                <a
                                    key={preview.id}
                                    href={preview.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {m.t('splicewire-beam-ux::messages.inspector_preview_release', { title: preview.title })}
                                </a>
                            ) : (
                                <span key={preview.id}>{m.t('splicewire-beam-ux::messages.inspector_preview_release_unavailable', { title: preview.title })}</span>
                            )
                        )
                    )}
                </div>
            </div>
            <div className="p-4">
                <fieldset disabled={editorDisabled}>
                    <RegionEditorBody
                        region={region}
                        schema={schema}
                        body={body}
                        onChange={onChange}
                        onSave={onSave}
                        onDiscard={onDiscard}
                        saving={saving}
                        saveLabel={saveLabel}
                        saveDisabled={saveDisabled}
                    />
                </fieldset>
                {publicationControls}
                <p className="mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    {region.note}
                </p>
            </div>
        </div>
    );
}
