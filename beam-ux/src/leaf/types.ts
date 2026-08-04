/**
 * The **inline leaf-lens seam** (beam Model-B ticket 10) — an ENGINE-AGNOSTIC contract for editing
 * the inline marks (bold / italic / link / inline-code) WITHIN a single block text run.
 *
 * This is the *leaf* lens: it owns inline marks inside ONE text node (a Prose/Heading text run), NOT
 * page structure — structure is the AST/BlockDoc's job (ticket 02). Distinct from block-level authoring.
 *
 * The seam maps a BlockDoc {@link TextNode} ⟷ an editor doc:
 *   read `TextNode.value` → `toDoc` → (edit in the engine's editor) → `fromDoc` → `patchText` → `.tsx`.
 *
 * Why a seam and not a hardcoded engine: the manifest / schema field vocab (ticket 09) NAMES the
 * engine (`{ kind: 'richtext', engine: 'mdx' }`). A second engine (e.g. `'prosemirror'`) binds via the
 * SAME contract + registry without touching a single call site — the generated Puck field asks the
 * registry for the engine the manifest named and gets back an {@link InlineLeafEditor}.
 */

/**
 * The engine's document representation of a text run's inline markup. Deliberately `unknown` at the
 * seam boundary: each engine owns its own doc shape (the mdx engine uses an {@link InlineDoc} array of
 * marked runs; a ProseMirror binding would use a ProseMirror `Node`). The seam only ever moves a doc
 * from `toDoc` into the engine's editor and back out through `fromDoc` — it never inspects it, so the
 * shape stays fully the engine's business. Call sites keep it opaque via this alias.
 */
export type EditorDoc = unknown;

/**
 * The ONE contract every rich-text engine binding implements. Two total functions, inverse to each
 * other over the inline-markup text of a single run:
 *
 *  - {@link toDoc}   — parse a text run's inline markup string INTO the engine's editor doc.
 *  - {@link fromDoc} — serialize the (edited) doc's marks BACK to the inline-markup string.
 *
 * The round-trip law the acceptance tests enforce: for any supported input `s`,
 * `fromDoc(toDoc(s))` is `s` up to mark-syntax normalization (e.g. `__x__` ⇒ `**x**`), and any run of
 * text carrying an UNKNOWN / unsupported mark is preserved as literal text — never dropped
 * (degrade-not-lose). `toDoc`/`fromDoc` know nothing of the AST or `.tsx`; the seam wires them to
 * `patchText` (see {@link bindTextNode}).
 */
export interface InlineLeafEditor<Doc extends EditorDoc = EditorDoc> {
    /** The engine's registry key — the name the manifest's `engine` field selects it by. */
    readonly engine: string;
    /** Parse a text run's inline markup into the engine's editor doc. */
    toDoc(text: string): Doc;
    /** Serialize the engine's editor doc's inline marks back to the inline-markup text. */
    fromDoc(doc: Doc): string;
}

/**
 * The engine-neutral inline-doc model the DEFAULT (`mdx`) binding uses — an ordered list of text runs,
 * each carrying a set of inline marks (and, for a link, its href). It is NOT part of the seam contract
 * (the seam's doc is opaque `EditorDoc`); it's exported so a host or a second engine can interoperate
 * with the mdx binding's doc without re-deriving the shape, and so tests can assert on it directly.
 *
 * A `link` mark additionally carries `href`; unknown marks a parser couldn't classify ride in `raw`
 * so serialization re-emits them verbatim (degrade-not-lose).
 */
export type InlineMark = 'strong' | 'em' | 'inlineCode' | 'link';

export interface InlineRun {
    /** The literal text of this run (marks already stripped from the syntax). */
    text: string;
    /** The inline marks applied to this run, OUTERMOST-FIRST (index 0 is the outer wrapper). */
    marks: InlineMark[];
    /** For a run carrying the `link` mark: the destination href. */
    href?: string;
}

export type InlineDoc = InlineRun[];
