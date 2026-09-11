// Shared insert-placement logic for the palette (both mounts). Mirrors the host `addBlock`: insert into
// the selected element if it's a container (and is the root), otherwise after the selection as a sibling.
// The body is a single-root JsonDoc `[root]`, so path "0" is the root — this subsumes the host's model.
import { getAt, indexOf, insertInto, isJsonBlock, isLeafText, parentOf } from '../blockdoc/json.js';
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';

/**
 * Insert a fresh block relative to the current selection. When the target is the root container (path
 * "0") and not a leaf, the block is appended INSIDE it; otherwise it lands as the selection's next sibling.
 *
 * **An EMPTY doc appends at the root array**, which is the case this used to refuse. Measured on
 * beam.test 2026-09-11 (G2-BEAM-AUTHOR-EMPTY-ENTRY): on the never-authored `/about` entry the palette's
 * "+ Heading" flipped the status bar to "Unsaved" and inserted nothing — `getAt([], '0')` is null, so
 * the guard below returned the doc unchanged and the author's first block was unperformable. A document
 * with no root is exactly the document that most needs its first block; refusing there is the one place
 * the "insert relative to something" model has nothing to be relative TO, and the honest answer is the
 * root array itself (`insertInto(doc, '', …)`).
 *
 * The guard is still right for its other case — a selection pointing at a node that no longer exists, on
 * a NON-empty doc, falls back to the root path "0" and inserts inside it as before.
 */
export function insertRelativeTo(
    doc: JsonDoc,
    selectedPath: string | null,
    make: () => JsonBlock,
): JsonDoc {
    const target = selectedPath && getAt(doc, selectedPath) ? selectedPath : '0';
    const node = getAt(doc, target);

    // No root at all: this is the document's first block. Append to the root ARRAY.
    if (doc.length === 0) {
        return insertInto(doc, '', 0, make());
    }

    if (!node || !isJsonBlock(node)) return doc;

    if (isLeafText(node) || target !== '0') {
        return insertInto(doc, parentOf(target) || '', indexOf(target) + 1, make());
    }
    return insertInto(doc, target, node.children.length, make());
}
