import { T as TextNode } from './types-K1Eu-Q2o.js';
import '@babel/types';

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
 * Why a seam and not a hardcoded engine: a field's `{ kind: 'richtext', engine: 'mdx' }` declaration
 * NAMES the engine. A second engine (e.g. `'prosemirror'`) binds via the SAME contract + registry
 * without touching a single call site — a field asks the registry for the named engine and gets back
 * an {@link InlineLeafEditor}.
 */
/**
 * The engine's document representation of a text run's inline markup. Deliberately `unknown` at the
 * seam boundary: each engine owns its own doc shape (the mdx engine uses an {@link InlineDoc} array of
 * marked runs; a ProseMirror binding would use a ProseMirror `Node`). The seam only ever moves a doc
 * from `toDoc` into the engine's editor and back out through `fromDoc` — it never inspects it, so the
 * shape stays fully the engine's business. Call sites keep it opaque via this alias.
 */
type EditorDoc = unknown;
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
interface InlineLeafEditor<Doc extends EditorDoc = EditorDoc> {
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
type InlineMark = 'strong' | 'em' | 'inlineCode' | 'link';
interface InlineRun {
    /** The literal text of this run (marks already stripped from the syntax). */
    text: string;
    /** The inline marks applied to this run, OUTERMOST-FIRST (index 0 is the outer wrapper). */
    marks: InlineMark[];
    /** For a run carrying the `link` mark: the destination href. */
    href?: string;
}
type InlineDoc = InlineRun[];

/**
 * The **inline leaf-engine registry** — the indirection that lets a manifest's `engine` name SELECT a
 * rich-text binding at runtime, so a second engine (ProseMirror) becomes bindable by registering it
 * here, with ZERO changes to any call site.
 *
 * A host registers its engine bindings once at boot (`registerLeafEngine(mdxLeafEngine)`); the generated
 * leaf field resolves the engine the manifest named via `resolveLeafEngine('mdx')`.
 */

/**
 * Register an engine binding under its `engine` key. Re-registering the same key REPLACES the prior
 * binding (last-writer-wins) — a host can swap the default mdx binding for a customized one without
 * touching call sites. Returns the binding so a registration can be one expression.
 */
declare function registerLeafEngine<Doc extends EditorDoc>(engine: InlineLeafEditor<Doc>): InlineLeafEditor<Doc>;
/** Look up a registered engine by name, or `undefined` if none is registered under that key. */
declare function getLeafEngine(engine: string): InlineLeafEditor | undefined;
/**
 * Resolve the engine the manifest named — the call-site entry point. Throws a clear error naming the
 * missing engine + the engines that ARE registered, so a manifest typo (`engine: 'prosmirror'`) fails
 * loudly at wire-up instead of silently dropping the leaf editor. Use {@link getLeafEngine} for the
 * soft (may-be-absent) lookup.
 */
declare function resolveLeafEngine(engine: string): InlineLeafEditor;
/** The engine names currently registered — for diagnostics / a manifest validator. */
declare function registeredLeafEngines(): string[];

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

/**
 * A bound leaf: the engine resolved for a specific {@link TextNode}, plus the two live moves the editor
 * host performs — `read()` to project the current text into an editor doc, and `write(doc)` to
 * serialize the edited doc and PATCH the AST text node (which recast reprints surgically). `write`
 * returns the serialized text it wrote so a caller can echo it into local UI state without re-reading.
 */
interface BoundLeaf<Doc extends EditorDoc = EditorDoc> {
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
declare function bindTextNode<Doc extends EditorDoc = EditorDoc>(textNode: TextNode, engineName: string): BoundLeaf<Doc>;

/**
 * The DEFAULT inline leaf engine: `engine: 'mdx'` — the inline-markup ⟷ doc binding the manifest's
 * `{ kind: 'richtext', engine: 'mdx' }` field selects.
 *
 * This engine's editor doc is the {@link InlineDoc} (an ordered list of marked text runs). Its markup
 * dialect is the INLINE subset of Markdown/MDX — exactly the marks a `@mdxeditor/editor` inline surface
 * emits: `**strong**`, `*em*` / `_em_`, `` `inlineCode` ``, and `[text](href)` links. It owns INLINE
 * marks ONLY — no headings, lists, or block structure (that's the AST/BlockDoc's job, ticket 02). This
 * keeps beam-ux dependency-free of `@mdxeditor/editor`/Lexical: the heavy React WYSIWYG widget lives
 * host-side (audiostud `mdx-field.tsx`); THIS is the pure text↔doc kernel that widget round-trips
 * through, and what the seam patches back into `.tsx`.
 *
 * Degrade-not-lose: any inline construct this parser doesn't classify (an unknown/exotic mark, a
 * malformed span) is preserved as LITERAL text in an unmarked run, so `fromDoc(toDoc(s))` never drops
 * an author's characters — it just doesn't promote them to a mark.
 */

/** Parse an inline-markup string into a flat list of marked runs. */
declare function parseInline(text: string): InlineDoc;
/**
 * Serialize an {@link InlineDoc} back to an inline-markup string (inverse of {@link parseInline}).
 *
 * The doc is a FLAT list of runs, but marks NEST: `**a *b* c**` parses to runs `['strong']`,
 * `['strong','em']`, `['strong']`. A naive per-run wrap would double the `**` on each run. So this
 * serializer walks the runs and emits mark delimiters at the boundaries where a mark ENTERS or LEAVES
 * scope — the classic open/close-stack over adjacent runs' mark arrays. A run whose marks are a prefix
 * extension of the previous run's opens the extra marks; a run that sheds marks closes them (LIFO).
 */
declare function serializeInline(doc: InlineDoc): string;
/**
 * The default `mdx` inline leaf engine. Register it (`registerLeafEngine(mdxLeafEngine)`) so a manifest
 * field `{ kind: 'richtext', engine: 'mdx' }` resolves to it. `toDoc`/`fromDoc` are the pure inline
 * parser/serializer above — the seam (`bindTextNode`) wires them to `patchText` for lossless `.tsx`.
 */
declare const mdxLeafEngine: InlineLeafEditor<InlineDoc>;

export { type BoundLeaf, type EditorDoc, type InlineDoc, type InlineLeafEditor, type InlineMark, type InlineRun, bindTextNode, getLeafEngine, mdxLeafEngine, parseInline, registerLeafEngine, registeredLeafEngines, resolveLeafEngine, serializeInline };
