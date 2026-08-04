/**
 * `@splicewire/beam-ux/leaf` — the pluggable inline rich-text LEAF-lens seam (beam Model-B ticket 10).
 *
 * The *leaf* lens edits the inline marks (bold / italic / link / inline-code) WITHIN a single block
 * text run — a Prose/Heading text node — and round-trips them losslessly into `.tsx` via ticket 02's
 * `patchText`. It owns inline marks INSIDE a text run; page structure stays the AST/BlockDoc's job.
 *
 * The rich-text engine is NOT hardcoded: the manifest / schema field vocab (ticket 09) names it
 * (`{ kind: 'richtext', engine: 'mdx' }`). A binding is any {@link InlineLeafEditor} registered under
 * its `engine` key; the generated leaf field resolves it by name. Ships ONE concrete binding — the
 * default `mdx` engine ({@link mdxLeafEngine}) backed by the inline-Markdown/MDX dialect the existing
 * `@mdxeditor/editor` surface speaks — and a second engine (ProseMirror) binds via the same seam with
 * zero call-site changes: implement `toDoc`/`fromDoc`, `registerLeafEngine(...)`, done.
 */

// The engine-agnostic contract + doc model.
export type {
    EditorDoc,
    InlineLeafEditor,
    InlineDoc,
    InlineRun,
    InlineMark,
} from './types.js';

// The engine registry — how the manifest's `engine` name selects a binding.
export {
    registerLeafEngine,
    getLeafEngine,
    resolveLeafEngine,
    registeredLeafEngines,
} from './registry.js';

// The seam bridge — TextNode ⟷ editor doc, threaded back through patchText to `.tsx`.
export { bindTextNode, type BoundLeaf } from './bind.js';

// The default binding: the `mdx` inline engine + its pure parser/serializer (exported so a host or a
// second engine can interoperate with, or reuse, the inline dialect).
export { mdxLeafEngine, parseInline, serializeInline } from './mdx-engine.js';
