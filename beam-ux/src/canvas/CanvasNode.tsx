// The editable canvas recursion — stamps `data-bd-path`, makes blocks draggable, edits leaf text inline,
// and renders opaque islands / opaque nodes SEALED. A faithful port of the host `CanvasNode`, re-based on
// the `JsonNode` tree from `@splicewire/beam-ux/jsondoc` + the injected CanvasConfig (registry / MDX
// island / — NO app imports).
import React from 'react';
import {CanvasSiblings, type ProseChange} from './CanvasSiblings';
import {
    isJsonOpaque,
    isJsonText,
    propValue,
    VOID_TAGS,
} from '../blockdoc/json.js';
import type { JsonNode } from '../blockdoc/json.js';
import { isEditGated, isIsland, useCanvas } from './context.js';
import { blockToProps, editGateOf, islandProps } from './props.js';
import { renderNode } from './TreeRender.js';
import { RetiredMdxIsland } from './mdx-island.js';

/** Which half of a hovered block's box a drag is over — the mount inserts on that edge. */
export type DropEdge = 'before' | 'after';

/**
 * Drag/drop callbacks the canvas raises upward (the mount owns drag state, so multiple sibling
 * CanvasNodes agree on a single source of truth for "what's being dragged, and over which edge").
 */
export type Dnd = {
    onDragStart: (path: string) => void;
    /** The drag is hovering `path`, over its top (`before`) or bottom (`after`) half. */
    onDragOverNode: (path: string, edge: DropEdge) => void;
    /**
     * Commit the move at whatever (path, edge) the mount last recorded via `onDragOverNode`. The
     * native `DataTransfer` is passed through (not just relied on via same-tree local state) because
     * a drag can originate OUTSIDE this component tree entirely — e.g. an insert-palette item hosted
     * by a shell region that is a REACT SIBLING of the canvas, not an ancestor/descendant, so it has
     * no shared React state to stash "what's being dragged" in. `null` when the browser doesn't
     * expose one (defensive; real drag events always carry it).
     */
    onDrop: (dataTransfer: DataTransfer | null) => void;
    onDragEnd: () => void;
};

export interface CanvasNodeProps {
    node: JsonNode;
    path: string;
    /** The path currently being inline-text-edited, or null. */
    editing: string | null;
    /** @deprecated Text leaves are edited by the prose seam; this callback is no longer called. */
    onEditText?: (path: string, text: string) => void;
    onEditProse?: ProseChange;
    onEditMd?: (path: string, md: string) => void;
    dnd: Dnd;
}

/** The vertical half of `el`'s box `clientY` falls in — the edge a drop at this cursor position targets. */
export function edgeAt(el: HTMLElement, clientY: number): DropEdge {
    const rect = el.getBoundingClientRect();
    return clientY - rect.top < rect.height / 2 ? 'before' : 'after';
}

export function CanvasNode({ node, path, editing, onEditMd, onEditProse, dnd }: CanvasNodeProps) {
    const config = useCanvas();
    const { MdxEdit, registry } = config;
    const isEditingThis = editing === path;

    // Text leaf — rendered as bare content (the parent element hosts it; contentEditable is applied there).
    if (isJsonText(node)) return <>{node.value}</>;

    // Opaque island (a dynamic map/conditional the lens couldn't decompose) — sealed, selectable, movable.
    // Render its verbatim source read-only; a click selects the block itself (pointer-events:none inner).
    if (isJsonOpaque(node)) {
        return (
            <div
                data-bd-path={path}
                className="ve-opaque"
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    dnd.onDragStart(path);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dnd.onDrop(e.dataTransfer);
                }}
                onDragEnd={dnd.onDragEnd}
                title={`Sealed ${node.reason} island`}
            >
                <pre className="ve-opaque-src" style={{ pointerEvents: 'none' }}>
                    {node.source}
                </pre>
            </div>
        );
    }

    const block = node;

    // The MDX node is edited with mdxeditor IN PLACE (interactive — NOT sealed). The editor body carries
    // `data-mdx-edit` so the canvas click handler leaves clicks to the editor; a HANDLE bar (outside that
    // region) selects the block itself so its properties show in the Inspector, and drags it to reorder.
    if (block.name === 'Mdx') {
        const file = propValue(block, 'file');
        const md = propValue(block, 'md');
        return (
            <div data-bd-path={path} className="ve-mdx-block">
                <div
                    className="ve-mdx-handle"
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        dnd.onDragStart(path);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dnd.onDrop(e.dataTransfer);
                    }}
                    onDragEnd={dnd.onDragEnd}
                    title="Select this content block"
                >
                    ◆ content{file ? ` · ${String(file)}` : ''}
                </div>
                {/* ux-0233: without an island (it retires per host, EP-42) the node is read-only and its clicks select it. */}
                {MdxEdit ? (
                    <div data-mdx-edit>
                        <MdxEdit
                            file={file !== undefined ? String(file) : undefined}
                            md={md !== undefined ? String(md) : undefined}
                            onChange={(next) => onEditMd?.(path, next)}
                        />
                    </div>
                ) : (
                    <RetiredMdxIsland file={file !== undefined ? String(file) : undefined} md={md !== undefined ? String(md) : undefined} />
                )}
            </div>
        );
    }

    // Entitlement-sealed: this author's can-map doesn't clear the block's data-edit-gate key. Rendered
    // like an opaque/component island — selectable/movable/deletable, its real content shown read-only
    // (via TreeRender's renderNode) rather than editable. (MDX blocks are exempted for now — they
    // already fork their own edit/view rendering via MdxEdit/MdxView, a separate follow-up to route
    // through this same gate.)
    if (isEditGated(config, block) || block.repeat) {
        return (
            <div
                data-bd-path={path}
                className={block.repeat ? 've-island ve-repeat' : 've-island ve-gated'}
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    dnd.onDragStart(path);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dnd.onDrop(e.dataTransfer);
                }}
                onDragEnd={dnd.onDragEnd}
                title={isEditGated(config, block) ? `Sealed — editing requires "${editGateOf(block)}"` : 'Repeat — Records from your current read'}
            >
                <div style={{ pointerEvents: 'none' }}>{renderNode(block, path, config)}</div>
            </div>
        );
    }

    const props: Record<string, unknown> = {
        'data-bd-path': path,
        // Set whenever the LENS parsed this as a PascalCase component tag (`block.isComponent`) —
        // regardless of whether it's currently registered as a sealed island (below) or falls through
        // to render/drill in as a plain tag. Before this, an unregistered (or drill-in-able) component
        // was visually IDENTICAL to a bare `<div>` — the only nodes with any distinct treatment were
        // ones already `isIsland` (registered), via `.ve-island`. A plain data attribute (not a class)
        // so CSS can target it with `[data-bd-component]` without a JS-side class-name concat.
        ...(block.isComponent ? { 'data-bd-component': 'true' } : {}),
        // A node mid text-edit isn't draggable — HTML5 drag and contentEditable's own click-drag text
        // selection fight over the same mousedown-then-move gesture, so a drag start here would hijack
        // what the user meant as "select this word" and the caret would never land.
        draggable: !isEditingThis,
        onDragStart: (e: React.DragEvent) => {
            // A drag begun inside the mdxeditor belongs to it — don't drag the containing block.
            if ((e.target as HTMLElement).closest('[data-mdx-edit]')) {
                e.preventDefault();
                return;
            }
            e.stopPropagation();
            dnd.onDragStart(path);
        },
        onDragOver: (e: React.DragEvent<HTMLElement>) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
        },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDrop(e.dataTransfer);
        },
        onDragEnd: dnd.onDragEnd,
        ...blockToProps(block, config.styleRegistry),
    };

    // Opaque component island: render the REAL registered component, SEALED — a selectable/movable/
    // deletable block with no drill-in. The inner wrapper is pointer-events:none so a click selects it.
    if (isIsland(config, block.name)) {
        const Comp = registry[block.name as string];
        const subtree = (nodes: JsonNode[], parent: string) => <div style={{pointerEvents:'auto', minHeight: nodes.length ? undefined : 24}} data-bd-slot={parent}
            onDragOver={event => {event.preventDefault(); event.stopPropagation(); dnd.onDragOverNode(`${parent}.${nodes.length}`, 'before');}}
            onDrop={event => {event.preventDefault(); event.stopPropagation(); dnd.onDrop(event.dataTransfer);}}>
            <CanvasSiblings nodes={nodes} parent={parent} editing={editing} onEditMd={onEditMd} onEditProse={onEditProse} dnd={dnd}/>
        </div>;
        const declaration = config.profile?.nodes.find(entry => entry.name === block.name);
        const names = new Set([...(declaration?.slots ?? []).map(slot => slot.name), ...Object.keys(block.slots ?? {})]);
        const slots = Object.fromEntries([...names].map(name => [name, subtree(block.slots?.[name] ?? [], `${path}.slots.${name}`)]));
        return (
            <div {...props} className="ve-island">
                <div style={{ pointerEvents: 'none' }}>
                    <Comp {...islandProps(block, config.styleRegistry)} {...slots}>
                        {block.children.length || declaration?.admitsChildCategories === null || (declaration?.admitsChildCategories?.length ?? 0) > 0 ? subtree(block.children, path) : undefined}
                    </Comp>
                </div>
            </div>
        );
    }

    const tag = block.name ?? 'div';

    if (VOID_TAGS.has(tag)) {
        return React.createElement(tag, props);
    }


    return React.createElement(
        tag,
        props,
        <CanvasSiblings nodes={block.children} parent={path} editing={editing}
            onEditMd={onEditMd} onEditProse={onEditProse} dnd={dnd}/>,
    );
}
