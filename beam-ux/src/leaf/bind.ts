/**
 * The seam bridge — maps a BlockDoc {@link TextNode} ⟷ an engine's editor doc, and threads a mark edit
 * back through `patchText` (ticket 02) so it round-trips LOSSLESSLY into `.tsx`.
 *
 * This is the wiring the generated leaf field (ticket 09 generator) mounts around whichever engine the
 * manifest named. It is engine-agnostic: it resolves the engine by name from the registry, reads
 * `TextNode.value` through `toDoc`, and on change serializes through `fromDoc` and calls `patchText`.
 * Only the target text node's tokens change on reprint — siblings + the block's structural attributes
 * are untouched (proved by the round-trip + surgical-patch tests).
 */

import { patchText } from '../blockdoc/patch-text.js';
import type { TextNode } from '../blockdoc/types.js';
import { resolveLeafEngine } from './registry.js';
import type { EditorDoc, InlineLeafEditor } from './types.js';

/**
 * A bound leaf: the engine resolved for a specific {@link TextNode}, plus the two live moves the editor
 * host performs — `read()` to project the current text into an editor doc, and `write(doc)` to
 * serialize the edited doc and PATCH the AST text node (which recast reprints surgically). `write`
 * returns the serialized text it wrote so a caller can echo it into local UI state without re-reading.
 */
export interface BoundLeaf<Doc extends EditorDoc = EditorDoc> {
    readonly engine: InlineLeafEditor<Doc>;
    readonly textNode: TextNode;
    /** Project the text node's CURRENT value into the engine's editor doc. */
    read(): Doc;
    /** Serialize `doc`'s marks and patch the text node's AST tokens; returns the written text. */
    write(doc: Doc): string;
}

/**
 * Bind a {@link TextNode} to the engine the manifest named. Resolves the engine from the registry (so a
 * second engine binds with no call-site change), then returns the `read`/`write` pair the editor host
 * drives: `read()` on mount, `write(doc)` on every change. `write` calls `patchText`, so after any edit
 * `print(blockDoc)` yields lossless `.tsx` with siblings + attrs untouched.
 */
export function bindTextNode<Doc extends EditorDoc = EditorDoc>(
    textNode: TextNode,
    engineName: string,
): BoundLeaf<Doc> {
    const engine = resolveLeafEngine(engineName) as InlineLeafEditor<Doc>;
    return {
        engine,
        textNode,
        read: () => engine.toDoc(textNode.value),
        write: (doc: Doc) => {
            const text = engine.fromDoc(doc);
            patchText(textNode, text);
            return text;
        },
    };
}
