import { LayoutTemplate, MousePointerSquareDashed } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SchemaNode } from '@schemastud/seam';
import { cn } from '@schemastud/ui';
import { useEntryBody, useSaveEntryBody } from './hooks';
import { RegionCanvas } from './RegionCanvas';
import { RegionInspector } from './RegionInspector';
import { RegionOverlay } from './RegionOverlay';
import { StructurePanel } from './StructurePanel';
import type { PaletteItem, Region, RegionKind, TreeNode } from './types';

export type BuilderMode = 'overlay' | 'structure';
/** WHERE the editor materializes in overlay mode when a region is dock-placed. */
export type EditorPlacement = 'inspector' | 'overlay';

/**
 * Kind-driven placement (the S10 rule): form / richtext / frame DOCK in the inspector (or structure
 * panel); list POPS as a floating overlay. The `EditorPlacement` prop is the fork for the dock-target
 * in overlay mode; a `list`-kind region always floats regardless.
 */
export function placementFor(kind: RegionKind, placement: EditorPlacement): EditorPlacement {
    if (kind === 'list') return 'overlay';
    return placement;
}

/* ─────────────────────────── the connected region editor ─────────────────────────── */
// Loads the engaged region's body via the package's react-query layer, holds the in-flight edit
// buffer, and saves through the injected client. Renders the inspector or the floating overlay.

function useRegionEditor(region: Region) {
    const query = useEntryBody(region.record);
    const save = useSaveEntryBody();
    const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

    const schema = (query.data?.schema ?? null) as SchemaNode | null;
    const body = draft ?? query.data?.body ?? {};

    return {
        schema,
        body,
        onChange: setDraft,
        onSave: () => save.mutate({ slug: region.record, body }),
        saving: save.isPending,
    };
}

function RegionInspectorConnected({ region }: { region: Region }) {
    const editor = useRegionEditor(region);
    return <RegionInspector region={region} {...editor} />;
}

function RegionOverlayConnected({ region, onClose }: { region: Region; onClose: () => void }) {
    const editor = useRegionEditor(region);
    return <RegionOverlay region={region} onClose={onClose} {...editor} />;
}

/* ─────────────────────────── mode toggle ─────────────────────────── */

function ModeToggle({
    mode,
    onChange,
}: {
    mode: BuilderMode;
    onChange: (m: BuilderMode) => void;
}) {
    return (
        <div className="flex items-center rounded-md border bg-card p-0.5 text-xs">
            {(['overlay', 'structure'] as const).map((m) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => onChange(m)}
                    className={cn(
                        'flex items-center gap-1.5 rounded px-2.5 py-1 font-medium capitalize transition-colors',
                        mode === m
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                    )}
                >
                    {m === 'overlay' ? (
                        <MousePointerSquareDashed className="size-3.5" />
                    ) : (
                        <LayoutTemplate className="size-3.5" />
                    )}
                    {m}
                </button>
            ))}
        </div>
    );
}

/* ─────────────────────────── root ─────────────────────────── */

/**
 * The BeamUx UX-builder root — in-app visual editing of the beam site's OWN front-end. Composes the
 * live region canvas, the docked/floating region editors, and the composition structure panel over ONE
 * mode toggle (overlay / structure). Overlay + Structure are CO-EQUAL, kind-driven placement. Load/save
 * routes through the package's react-query hooks + the injected transport client.
 */
export function UxBuilder({
    regions,
    pageTree,
    palette,
    editorPlacement = 'inspector',
    initialMode = 'overlay',
    initialEngaged,
}: {
    regions: Region[];
    pageTree: TreeNode;
    palette: PaletteItem[];
    /** In overlay mode, where a dock-placed editor mounts. `list`-kind regions always float. */
    editorPlacement?: EditorPlacement;
    initialMode?: BuilderMode;
    /** The region id engaged on first mount (defaults to the first region). */
    initialEngaged?: string;
}) {
    const [mode, setMode] = useState<BuilderMode>(initialMode);
    const [engaged, setEngaged] = useState<string | null>(
        initialEngaged ?? regions[0]?.id ?? null,
    );
    const [selected, setSelected] = useState<string | null>(regions[0]?.id ?? null);

    const active = useMemo(
        () => regions.find((r) => r.id === engaged) ?? null,
        [regions, engaged],
    );
    const selectedRegion = useMemo(
        () => regions.find((r) => r.id === selected) ?? null,
        [regions, selected],
    );

    const dockPlacement = active ? placementFor(active.kind, editorPlacement) : editorPlacement;
    const dockInInspector = dockPlacement === 'inspector';

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
                    editing the app&rsquo;s own front-end
                </span>
                <ModeToggle mode={mode} onChange={setMode} />
            </div>

            {mode === 'structure' ? (
                <StructurePanel
                    pageTree={pageTree}
                    palette={palette}
                    selected={selected}
                    selectedRegion={selectedRegion}
                    onSelect={setSelected}
                    renderEditor={(region) => (
                        <RegionInspectorConnected key={region.id} region={region} />
                    )}
                />
            ) : dockInInspector ? (
                /* INSPECTOR placement — docked right-hand column, always present. */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]">
                    <RegionCanvas regions={regions} engaged={engaged} onEngage={setEngaged} />
                    <aside className="lg:sticky lg:top-2 lg:self-start">
                        {active ? (
                            <RegionInspectorConnected key={active.id} region={active} />
                        ) : (
                            <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
                                Engage a region on the left to edit it here.
                            </div>
                        )}
                    </aside>
                </div>
            ) : (
                /* OVERLAY placement — full-width canvas + a floating in-context panel. */
                <div className="relative">
                    <div className="max-w-3xl">
                        <RegionCanvas regions={regions} engaged={engaged} onEngage={setEngaged} />
                    </div>
                    {active && (
                        <div className="fixed right-6 top-24 z-40 w-[380px]">
                            <RegionOverlayConnected
                                key={active.id}
                                region={active}
                                onClose={() => setEngaged(null)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
