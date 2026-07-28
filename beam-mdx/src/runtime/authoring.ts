// =============================================================================
// The authoring counterpart to the runtime render path: split/rejoin frontmatter and a
// save/load transport. The write-side twin of `fetchMdx` — generic by construction: it knows
// nothing about routes, gates, tenants, or "docs". The caller supplies the URL and (optionally)
// the transport; the app layer injects the resolved-by-name URL and CSRF.
// =============================================================================

import { fetchMdx } from './runtime-mdx';

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

/** A transport that resolves a URL to raw MDX text (throws on failure). Defaults to {@link fetchMdx}. */
export type MdxLoader = (url: string) => Promise<string>;

/** A transport that persists a raw MDX body to a URL (throws on failure). */
export type MdxSaver = (url: string, body: string) => Promise<void>;

/**
 * Persist raw MDX to a URL with a same-origin `PUT` of `text/markdown`. The write twin of
 * {@link fetchMdx}: content rides as a raw document body (not a JSON field), so the bytes are
 * exact end to end. Carries **no** CSRF — the app layer overrides the saver to add its token.
 * Exported so a consumer can compose it.
 */
export const putMdx: MdxSaver = async (url, body) => {
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/markdown' },
        credentials: 'same-origin',
        body,
    });

    if (!response.ok) {
        throw new Error(`Failed to save MDX (${response.status})`);
    }
};

/**
 * Load the raw MDX source at a URL, seeding an editor. Thin over the transport so the URL is
 * caller-supplied and the transport is overridable (auth headers, a stub in tests); it hardcodes
 * no path. Defaults to {@link fetchMdx} (same-origin `text/markdown` GET).
 */
export async function loadRawMdx(url: string, loader: MdxLoader = fetchMdx): Promise<string> {
    return loader(url);
}

/**
 * Save an edited MDX body to a URL. Mirrors {@link loadRawMdx}: caller-supplied URL, overridable
 * transport (defaults to {@link putMdx}), no hardcoded path. The app passes a `saver` that adds
 * CSRF + the resolved-by-name endpoint.
 */
export async function saveMdx(url: string, body: string, saver: MdxSaver = putMdx): Promise<void> {
    return saver(url, body);
}
