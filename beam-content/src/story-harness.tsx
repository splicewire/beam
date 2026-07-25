import type { NodeViewComponentProps } from '@schemastud/blockdoc/react';

/**
 * Build a minimal, valid {@link NodeViewComponentProps} off a plain attrs bag — for stories and
 * the isolation-mount test. Our NodeViews read only `node.attrs`, `updateAttrs`, `contentRef` and
 * `selected`; `view`/`getPos` are cast placeholders they never touch.
 */
export function makeNodeProps(
    attrs: Record<string, unknown>,
    over: Partial<NodeViewComponentProps> = {},
): NodeViewComponentProps {
    return {
        node: { attrs, isLeaf: true } as unknown as NodeViewComponentProps['node'],
        view: {} as NodeViewComponentProps['view'],
        getPos: () => 0,
        updateAttrs: () => {},
        contentRef: null,
        selected: false,
        ...over,
    };
}
