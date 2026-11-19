import { JsonDoc } from '@splicewire/beam-ux/jsondoc';
import { LensContext } from '@splicewire/beam-ux/tsx-lens';

/**
 * The MDX Lens's reading half (ux-0233 d2): an MDX page body → a JsonDoc, the same shape the TSX Lens
 * produces, so an MDX page holds blocks as a `tsx` page does.
 *
 * - Markdown reads as the HTML profile's own nodes (`p`, `h1`–`h6`, `ul`/`ol`/`li`, `blockquote`, `pre` > `code`,
 *   `strong`, `em`, `code`, `a`, `img`, `hr`, `br` and the table elements). A soft line break inside a paragraph
 *   becomes a space.
 * - JSX reads as components. A tag's attributes are read by the TSX Lens itself, so a prop, a literal in braces,
 *   a named slot the profile declares, `bdField` and the lens-owned `bdStyle` / `bdRepeat` / `bdWhen` / `bdEvent` mean exactly
 *   what they mean in a `.tsx` page. Its children are Markdown, read here.
 * - A comment, and any other expression, becomes an Opaque Island, carried verbatim. So does a tag with a spread
 *   attribute, which only source can hold.
 * - Code outside the JSX isn't a page: an `import` or an `export` refuses, except schemastud's
 *   `export const meta = {…}`, which is returned beside the body for its conversion to frontmatter (d9).
 *
 * The input is the body only, without frontmatter: frontmatter is a page's settings, never its body (d3). Ids are
 * not read; the server reattaches them against the Working Head by content, as for the TSX Lens.
 */
interface MdxRead {
    doc: JsonDoc;
    /** The verbatim source of an `export const meta = {…}` statement, when the body has one. */
    meta: string | null;
    /**
     * That statement's value when it is static (literals, arrays and objects of them), which a host's conversion writes
     * as frontmatter (ux-0233 d9); null when there is no meta, or when only running code could give its value.
     */
    metaData: Record<string, unknown> | null;
}
declare class MdxLensError extends Error {
    name: string;
}
/** Read an MDX body into a JsonDoc. Throws {@link MdxLensError} when the body isn't a page. */
declare function readMdx(mdx: string, context?: LensContext): MdxRead;

/**
 * The MDX Lens's printing half (ux-0233 d2): a JsonDoc → canonical MDX. The mirror and every compile read its
 * output.
 *
 * - A block Markdown can express prints as Markdown, one line per paragraph.
 * - Anything else prints as JSX: a component, a prop Markdown has no syntax for, and the lens-owned fields, whose
 *   attributes print exactly as the TSX printer prints them (`jsxAttributes`). A tag whose content is inline
 *   prints it on the tag's own line; flow content prints on lines of its own.
 * - An Opaque Island prints its source verbatim.
 *
 * Printing is canonical: for any body the lens reads, `printMdx(readMdx(printMdx(readMdx(x).doc)).doc)` is
 * `printMdx(readMdx(x).doc)`. Ids are never printed.
 */
declare function printMdx(doc: JsonDoc): string;

export { MdxLensError, type MdxRead, printMdx, readMdx };
