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
    PropKind,
    TextNode,
} from './types.js';

// The PuckData ⟷ BlockDoc bridge (ticket 08) — the reverse .tsx→body leg. `puckToTsx` mirrors PHP
// PuckPageCodegen exactly; `blockDocToPuck` parses a page .tsx back into Puck Data for file→DB sync.
export { blockDocToPuck, puckToTsx, stripIds, CODEGEN_MARKER } from './puck.js';
export type { PuckData, PuckNode, PuckProps, PuckPropValue } from './puck.js';
