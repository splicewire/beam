// Read-only renderer for a JsonNode tree (the view side; CanvasNode is the edit side). Pages render their
// body through this so the LIVE view and the editor share one source: a registered PascalCase name renders
// its real designed component (opaque island), everything else is an intrinsic element. No editing chrome,
// no data-bd-path. Port of the host `TreeRender`, re-based on JsonNode + the injected registry/MdxView.
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
    isJsonOpaque,
    isJsonText,
    propValue,
    VOID_TAGS,
} from '../blockdoc/json.js';
import type { JsonNode } from '../blockdoc/json.js';
import { isIsland, useCanvas } from './context.js';
import type { CanvasConfig } from './context.js';
import { blockToProps, islandProps } from './props.js';

/**
 * Render a single node (and its subtree) read-only. Exported so CanvasNode can reuse it for an
 * entitlement-sealed node's content (same "sealed but real" rendering an opaque/component island
 * already gets — just gated on the viewer's can-map instead of source-reachability).
 */
export function renderNode(node: JsonNode, path: string, config: CanvasConfig): ReactNode {
    if (isJsonText(node)) return node.value;
    // A sealed opaque island renders its verbatim source read-only (mirrors the canvas seal, view-side).
    if (isJsonOpaque(node)) {
        return createElement('pre', { key: path, className: 've-opaque-src' }, node.source);
    }

    const block = node;

    if (block.name === 'Mdx') {
        const file = propValue(block, 'file');
        const md = propValue(block, 'md');
        return (
            <config.MdxView
                key={path}
                file={file !== undefined ? String(file) : undefined}
                md={md !== undefined ? String(md) : undefined}
            />
        );
    }

    if (isIsland(config, block.name)) {
        return createElement(config.registry[block.name as string], {
            key: path,
            ...islandProps(block),
        });
    }

    const tag = block.name ?? 'div';
    const props = { key: path, ...blockToProps(block) };

    if (VOID_TAGS.has(tag)) return createElement(tag, props);

    return createElement(
        tag,
        props,
        block.children.map((c, i) => renderNode(c, `${path}.${i}`, config)),
    );
}

/** Render a JsonDoc (or a single-root body) read-only through the injected CanvasConfig. */
export function TreeRender({ tree }: { tree: JsonNode | JsonNode[] }) {
    const config = useCanvas();
    const roots = Array.isArray(tree) ? tree : [tree];
    return <>{roots.map((n, i) => renderNode(n, String(i), config))}</>;
}
