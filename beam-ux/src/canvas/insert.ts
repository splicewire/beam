// Shared insert-placement logic for the palette (both mounts). Mirrors the host `addBlock`: insert into
// the selected element if it's a container (and is the root), otherwise after the selection as a sibling.
// The body is a single-root JsonDoc `[root]`, so path "0" is the root — this subsumes the host's model.
import { getAt, indexOf, insertInto, isJsonBlock, isLeafText, parentOf } from '../blockdoc/json.js';
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';

/**
 * Insert a fresh block relative to the current selection. When the target is the root container (path
 * "0") and not a leaf, the block is appended INSIDE it; otherwise it lands as the selection's next sibling.
 */
export function insertRelativeTo(
    doc: JsonDoc,
    selectedPath: string | null,
    make: () => JsonBlock,
): JsonDoc {
    const target = selectedPath && getAt(doc, selectedPath) ? selectedPath : '0';
    const node = getAt(doc, target);
    if (!node || !isJsonBlock(node)) return doc;

    if (isLeafText(node) || target !== '0') {
        return insertInto(doc, parentOf(target) || '', indexOf(target) + 1, make());
    }
    return insertInto(doc, target, node.children.length, make());
}
