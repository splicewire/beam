import type { ReactNode } from 'react';
import { cn } from '@schemastud/ui';
import { KIND_ICON } from './kindIcon';
import type { PaletteItem, Region, TreeNode } from './types';
import { UX_BUILDER_CSS } from './css';

function TreeRow({
    node,
    depth,
    selected,
    onSelect,
}: {
    node: TreeNode;
    depth: number;
    selected: string | null;
    onSelect: (regionId: string) => void;
}) {
    const isRegion = node.kind === 'region';
    const isSel = isRegion && node.regionId === selected;
    return (
        <>
            <button
                type="button"
                disabled={!isRegion}
                onClick={() => isRegion && node.regionId && onSelect(node.regionId)}
                style={{ paddingLeft: 8 + depth * 16 }}
                className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] transition-colors',
                    isRegion ? 'hover:bg-muted/60' : 'cursor-default text-muted-foreground',
                    isSel && 'bg-primary/5 font-medium text-foreground',
                )}
            >
                <span className="font-mono text-[10px] uppercase text-muted-foreground/70">
                    {node.kind[0]}
                </span>
                <span className="truncate">{node.label}</span>
            </button>
            {node.children?.map((c) => (
                <TreeRow key={c.id} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
            ))}
        </>
    );
}

/**
 * The tree's OWN rungs, in depth order, deduplicated — `page › region` over a page-rooted tree,
 * `layout › template › page › region` over a fully composed one.
 *
 * The header used to be the fixed string "layout › template › page › regions" above a tree that
 * contains only page › region, because no host resolves the upper two rungs yet: a label describing
 * an aspiration over data that describes something else, which makes a reader trust the panel more
 * than they should (beam-docs-satellite 64). Deriving it means the label cannot be wrong again — the
 * day a composition model lands, the header grows the rungs the tree grew.
 */
export function treeKindPath(node: TreeNode): string {
    const kinds: TreeNode['kind'][] = [];
    for (let cursor: TreeNode | undefined = node; cursor; cursor = cursor.children?.[0]) {
        if (!kinds.includes(cursor.kind)) kinds.push(cursor.kind);
    }
    return kinds.join(' › ');
}

/**
 * Structure mode — the page-composition layer, kept SEPARATE from overlay editing. The composition
 * tree (the rungs the tree actually carries) on the left with the selected region's placement config
 * beneath it, and the component palette on the right. `renderEditor` is the editor slot for the
 * selected region (the host wires load/save through it); the palette is the drop-source structural
 * layer.
 */
export function StructurePanel({
    pageTree,
    palette,
    selected,
    selectedRegion,
    onSelect,
    renderEditor,
}: {
    pageTree: TreeNode;
    palette: PaletteItem[];
    selected: string | null;
    selectedRegion: Region | null;
    onSelect: (regionId: string) => void;
    renderEditor: (region: Region) => ReactNode;
}) {
    return (
        <div className="beam-ux-structure-grid grid grid-cols-1 gap-6">
            <style>{UX_BUILDER_CSS}</style>
            <div className="space-y-6">
                {/* the composition tree */}
                <section className="rounded-lg border bg-card">
                    <div className="border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Composition tree &mdash; {treeKindPath(pageTree)}
                    </div>
                    <div className="p-2">
                        <TreeRow node={pageTree} depth={0} selected={selected} onSelect={onSelect} />
                    </div>
                </section>

                {/* selected placement config */}
                {selectedRegion && (
                    <section>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Placement config
                            </span>
                        </div>
                        {renderEditor(selectedRegion)}
                    </section>
                )}
            </div>

            {/* palette — drop a component into a placement (the page-composition structural layer) */}
            <aside className="space-y-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Component palette
                </div>
                {palette.map((p) => {
                    const Icon = KIND_ICON[p.kind];
                    return (
                        <div
                            key={p.key}
                            className="flex items-start gap-3 rounded-lg border border-dashed bg-card p-3"
                        >
                            <Icon className="mt-0.5 size-4 flex-none text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium">{p.label}</div>
                                <div className="text-xs text-muted-foreground">{p.hint}</div>
                            </div>
                            <span className="cursor-grab select-none text-muted-foreground">&#10287;</span>
                        </div>
                    );
                })}
                <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
                    Structure = the page-composition layer, kept separate from overlay editing. Drag a
                    component into a placement; overlay mode then edits it in situ.
                </p>
            </aside>
        </div>
    );
}
