// The editable canvas recursion — stamps `data-bd-path`, makes blocks draggable, edits leaf text inline,
// and renders opaque islands / opaque nodes SEALED. A faithful port of the host `CanvasNode`, re-based on
// the `JsonNode` tree from `@splicewire/beam-ux/blockdoc/json` + the injected CanvasConfig (registry / MDX
// island / — NO app imports).
import React from 'react';
import {
    isJsonOpaque,
    isJsonText,
    isLeafText,
    propValue,
    VOID_TAGS,
} from '../blockdoc/json.js';
import type { JsonBlock, JsonNode } from '../blockdoc/json.js';
import { isIsland, useCanvas } from './context.js';
import { blockToProps, islandProps } from './props.js';

/** Drag/drop callbacks the canvas raises upward (the mount owns drag state). */
export type Dnd = { onDragStart: (path: string) => void; onDropBefore: (path: string) => void };

export interface CanvasNodeProps {
    node: JsonNode;
    path: string;
    /** The path currently being inline-text-edited, or null. */
    editing: string | null;
    onEditText: (path: string, text: string) => void;
    onEditMd?: (path: string, md: string) => void;
    dnd: Dnd;
}

export function CanvasNode({ node, path, editing, onEditText, onEditMd, dnd }: CanvasNodeProps) {
    const config = useCanvas();
    const { MdxEdit, registry } = config;

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
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dnd.onDropBefore(path);
                }}
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
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dnd.onDropBefore(path);
                    }}
                    title="Select this content block"
                >
                    ◆ content{file ? ` · ${String(file)}` : ''}
                </div>
                <div data-mdx-edit>
                    <MdxEdit
                        file={file !== undefined ? String(file) : undefined}
                        md={md !== undefined ? String(md) : undefined}
                        onChange={(next) => onEditMd?.(path, next)}
                    />
                </div>
            </div>
        );
    }

    const props: Record<string, unknown> = {
        'data-bd-path': path,
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            // A drag begun inside the mdxeditor belongs to it — don't drag the containing block.
            if ((e.target as HTMLElement).closest('[data-mdx-edit]')) {
                e.preventDefault();
                return;
            }
            e.stopPropagation();
            dnd.onDragStart(path);
        },
        onDragOver: (e: React.DragEvent) => e.preventDefault(),
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDropBefore(path);
        },
        ...blockToProps(block),
    };

    // Opaque component island: render the REAL registered component, SEALED — a selectable/movable/
    // deletable block with no drill-in. The inner wrapper is pointer-events:none so a click selects it.
    if (isIsland(config, block.name)) {
        const Comp = registry[block.name as string];
        return (
            <div {...props} className="ve-island">
                <div style={{ pointerEvents: 'none' }}>
                    <Comp {...islandProps(block)} />
                </div>
            </div>
        );
    }

    const tag = block.name ?? 'div';

    if (VOID_TAGS.has(tag)) {
        return React.createElement(tag, props);
    }

    if (editing === path && isLeafText(block)) {
        return React.createElement(
            tag,
            {
                ...props,
                contentEditable: true,
                suppressContentEditableWarning: true,
                onBlur: (e: React.FocusEvent<HTMLElement>) =>
                    onEditText(path, e.currentTarget.textContent ?? ''),
            },
            childText(block),
        );
    }

    return React.createElement(
        tag,
        props,
        block.children.map((c, i) => (
            <CanvasNode
                key={`${path}.${i}`}
                node={c}
                path={`${path}.${i}`}
                editing={editing}
                onEditText={onEditText}
                onEditMd={onEditMd}
                dnd={dnd}
            />
        )),
    );
}

/** The text content of a leaf block (its text children joined) — rendered inside contentEditable. */
function childText(block: JsonBlock): string {
    return block.children.map((c) => (isJsonText(c) ? c.value : '')).join('');
}
