// Which entry FORMATS this canvas may open — the client mirror of beam-ux's server-side
// `Splicewire\Beam\Ux\Codec\AcceptsJsonDoc` capability.
//
// The canvas edits a JsonDoc (`@splicewire/beam-ux/tsx-lens`'s `JsonNode[]`). An entry's body language
// is its own axis, and only a codec that can print a JsonDoc back to source may store one. `tsx` is the
// only such codec today (`TsxBodyCodec::decode()`'s `array_is_list` branch → `JsonDocPrinter`); mdx and
// css cannot, and `MdxBodyCodec::decode()` handed a JsonDoc silently returns `''`.
//
// Measured 2026-09-11 (G2-BEAM-AUTHOR-ENTRY): with no such check the operator dock opened this canvas
// on the mdx `/docs` entry, Save wrote its tree over the `{frontmatter,content}` particle, the disk
// mirror wrote a 0-byte `docs.mdx`, and the public page went blank for every visitor.
//
// ⚠️ The SERVER is the authority and now refuses that write with a 422. This predicate is not a second
// gate — it is what keeps an author from being shown an editor whose every Save will be refused. Where
// they disagree, the server wins and the client is the thing to fix.

/**
 * The entry formats whose codec can carry a JsonDoc wherever the host runs — the LEGACY answer, used only when the
 * server did not say the entry's body kind. Extend only alongside a PHP `AcceptsJsonDoc`.
 */
export const CANVAS_FORMATS: readonly string[] = ['tsx'];

/**
 * An entry's **Body Kind**, as the server declares it (`BeamUxEntry::bodyKind()`, ADR-0228 d1): `blocks` when its codec
 * carries a JsonDoc. It is per host for MDX: a host that holds MDX as blocks (ADR-0233 d1) declares its MDX pages
 * `blocks`, and one that keeps MDX as source declares them `source`.
 */
export type BodyKind = 'blocks' | 'source' | 'form';

/**
 * May the canvas open this entry? The Body Kind chooses the surface (beam JS ADR-0006 d1): the canvas opens every
 * entry that holds blocks, MDX pages included. An entry whose server did not say its body kind falls back to the
 * format gate, so an older server never has the canvas offered on an MDX page it keeps as source.
 */
export function canvasAccepts(entry: { format?: string | null; bodyKind?: string | null }): boolean {
    if (typeof entry.bodyKind === 'string' && entry.bodyKind !== '') {
        return entry.bodyKind === 'blocks';
    }

    return canvasAcceptsFormat(entry.format);
}

/**
 * May the canvas open an entry of this format?
 *
 * `null`/`undefined` is **unknown**, not "any", and answers `false`: the two ref branches that cannot
 * carry a format (`?beam_entry=<slug>` and the component-name guess) would otherwise re-open exactly
 * the hole this closes. A host that genuinely knows its pages are tsx supplies the format rather than
 * relying on a permissive default.
 */
export function canvasAcceptsFormat(format: string | null | undefined): boolean {
    return typeof format === 'string' && CANVAS_FORMATS.includes(format);
}

/** Why the canvas declined — a sentence for the author, naming the format and what to do instead. */
export function canvasRefusalFor(format: string | null | undefined): string {
    return typeof format === 'string' && format !== ''
        ? `This page is authored as ${format} source, which the visual editor cannot open — it edits a block document, and saving one here would replace the ${format} source with an empty file. Edit its source file instead.`
        : 'This page does not say what it is authored as, so the visual editor will not open it — opening the wrong editor is how a page loses its source. Bind the entry (its id and format) to the page first.';
}
