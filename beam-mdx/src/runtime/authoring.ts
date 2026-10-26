// =============================================================================
// The authoring counterpart to the runtime render path: split/rejoin frontmatter. (Its raw-file
// save/load transport, `loadRawMdx`/`saveMdx`/`putMdx`, retired with the hosts' raw-file write path:
// laravel-beam-ux ADR-0233 decision 10, EP-42 S2. An MDX page is written through the entry operations.)
// =============================================================================

/**
 * The flat-scalar frontmatter map — one `key: value` per line, values kept as their raw string
 * remainder. This is the same frontmatter subset the build-time content plane reads (the draft
 * gate's `readFrontmatter`) and the server twin (`Mdx::fields`), so the three stay in agreement.
 * Nested/structured YAML is out of scope for this primitive (the content plane doesn't use it).
 */
export type MdxFrontmatter = Record<string, string>;

export interface ParsedMdx {
    /** The parsed flat-scalar frontmatter (empty when the document has no leading `---` block). */
    frontmatter: MdxFrontmatter;
    /** Everything after the closing `---` delimiter, byte-for-byte (empty string if none). */
    body: string;
    /** Whether a leading `---` frontmatter block was present. */
    hasFrontmatter: boolean;
}

// Matches a leading `---` block and the single newline after its closing `---`, so `body` starts
// at the real content. Mirrors the build preset's reader (`/^---\r?\n([\s\S]*?)\r?\n---/`).
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/;

/**
 * Split a raw MDX document into its flat-scalar frontmatter and its body. Lossless for the
 * canonical form this primitive owns — one `key: value` per line, `---` delimiters — so
 * {@link serializeMdx}`(parseFrontmatter(x))` reproduces `x`. A document with no leading `---`
 * returns an empty map and the whole string as `body`.
 */
export function parseFrontmatter(raw: string): ParsedMdx {
    const match = raw.match(FRONTMATTER_RE);

    if (!match) {
        return { frontmatter: {}, body: raw, hasFrontmatter: false };
    }

    const frontmatter: MdxFrontmatter = {};
    for (const line of match[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
        if (kv) {
            frontmatter[kv[1]] = kv[2];
        }
    }

    return {
        frontmatter,
        body: raw.slice(match[0].length),
        hasFrontmatter: true,
    };
}

/**
 * Reserialize a flat-scalar frontmatter map + a body back into a raw MDX document. The inverse
 * of {@link parseFrontmatter}. An empty map with `hasFrontmatter: false` (or no keys) emits the
 * body alone — no empty `---` block. Field order follows the map's insertion order, so mutating
 * a parsed map's values (or adding keys) reserializes predictably.
 */
export function serializeMdx(parsed: ParsedMdx): string {
    const keys = Object.keys(parsed.frontmatter);

    if (keys.length === 0 && !parsed.hasFrontmatter) {
        return parsed.body;
    }

    const block = keys.map((key) => `${key}: ${parsed.frontmatter[key]}`).join('\n');

    return `---\n${block}\n---\n${parsed.body}`;
}

/**
 * Convenience overload: build a raw document from a frontmatter map + body directly (the shape a
 * form + editor produce). Emits a `---` block whenever the map is non-empty.
 */
export function serializeFrontmatter(frontmatter: MdxFrontmatter, body: string): string {
    return serializeMdx({ frontmatter, body, hasFrontmatter: Object.keys(frontmatter).length > 0 });
}
