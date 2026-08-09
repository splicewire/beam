/**
 * `@splicewire/beam-ux/blockdoc` — the lossless `.tsx` ⟷ BlockDoc lens.
 *
 * A JS substrate that parses a page `.tsx` file into an editable BlockDoc tree and
 * serializes it back byte-identically. The parsed recast AST is the source of truth;
 * the BlockDoc is an editable lens over it (each block/prop/text holds a live AST node
 * reference). Edits patch nodes; recast reprints untouched nodes from their original
 * tokens. Foundation for file→DB sync, prop panels, the rich-text leaf, opaque islands,
 * and the canvas (beam Model-B tickets 08/09/10/11/16).
 */

import { parse } from './lens.js';
import { jsonToTsx } from './json.js';
import type { JsonDoc } from './json.js';
import type { BlockDoc } from './types.js';

export {
    parse,
    print,
    patchProp,
    patchPropExpression,
    patchText,
    addProp,
    removeProp,
} from './lens.js';
export type {
    BlockDoc,
    BlockNode,
    BlockChild,
    BlockProp,
    OpaqueNode,
    PropKind,
    TextNode,
} from './types.js';

// The PuckData ⟷ BlockDoc bridge (ticket 08) — the reverse .tsx→body leg. `puckToTsx` mirrors PHP
// PuckPageCodegen exactly; `blockDocToPuck` parses a page .tsx back into Puck Data for file→DB sync.
export { blockDocToPuck, puckToTsx, stripIds, CODEGEN_MARKER, OPAQUE_ISLAND_TYPE } from './puck.js';
export type { PuckData, PuckNode, PuckProps, PuckPropValue } from './puck.js';

// The browser-safe JSON projection (editor-promotion ticket 01) — the AST-free runtime + persistence
// shape the visual editor canvas edits. The `toJson`/`jsonToTsx` seam is re-exported here for SERVER
// consumers; a BROWSER bundle must import `@splicewire/beam-ux/blockdoc/json` directly (this index
// pulls the Babel-backed lens; the `/json` subpath is Babel-free). The JSON edit ops + guards are
// deliberately NOT re-exported here — some names (`removeProp`) collide with the AST-lens API; the
// canvas gets them from the `/json` subpath.
export { toJson, jsonToTsx } from './json.js';
export type {
    JsonNode,
    JsonBlock,
    JsonText,
    JsonOpaque,
    JsonProp,
    JsonDoc,
} from './json.js';

/**
 * Re-parse a JSON document back into a Babel-backed BlockDoc (build/server side; pulls recast/@babel
 * via {@link parse}). `parse(jsonToTsx(doc))` — the closing leg of the JSON⟷.tsx round-trip. The
 * browser never calls this; it edits the JSON directly and persists it.
 */
export function fromJson(doc: JsonDoc): BlockDoc {
    return parse(jsonToTsx(doc));
}
