/**
 * `@splicewire/beam-ux/manifest` — the block-manifest → Puck-config generator (beam Model-B ticket 09).
 *
 * A host authors ONE declarative block manifest (its block vocabulary: props + Puck fields + a render
 * ref into its hand-written `blocks.tsx`); this generic generator emits the Puck `config.tsx` field/
 * wiring layer from it. Kills the duplication between a block's runtime component and its editor field
 * schema; the universal attribute editors (className / data-* / style) come free on every block, wired
 * to the lens's attr add/remove ops so panel edits round-trip losslessly to `.tsx`.
 */

export {
    generatePuckConfig,
    attributeFields,
    CONFIG_CODEGEN_MARKER,
} from './generator.js';
export type {
    BlockManifest,
    BlockSpec,
    PropSpec,
    FieldSpec,
    RawField,
} from './generator.js';
