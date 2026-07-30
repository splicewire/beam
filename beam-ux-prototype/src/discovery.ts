/**
 * The prototype-path grammar — ONE spelling of the discovery rules, shared by the route mount
 * (`createPrototypeRoutes`) and the index (`Gallery`). These two MUST agree: the slug the router
 * mounts (`/_prototype/<slug>`) has to match the slug the gallery links to, or a card 404s. Keeping
 * the parse in one place is the whole point of the extraction ("stops being copy-pasted runtime that
 * drifts") applied to the package's own internals.
 */

/** Default route namespace prototypes mount under. */
export const NAMESPACE_DEFAULT = '/_prototype';

// The convention anchor: every prototype tree lives under a `_prototype/` directory, so glob keys
// always contain that segment regardless of how deep the host's call site sits.
const DIR_MARKER = '_prototype/';

export interface ParsedPrototypePath {
    /** per-effort subdir under `_prototype/`, or `'root'` */
    dir: string;
    /** flat route slug: basename minus `.tsx` minus an optional `ar`/ticket-number prefix */
    slug: string;
    /** ticket number captured from the prefix, or `null` */
    ticket: string | null;
    /** true = sits under a `_`-prefixed dir (`_chrome`, `_fixtures`) — shared chrome, not a prototype */
    isExcluded: boolean;
}

/** Path relative to `_prototype/` (or just the basename if the marker is absent). */
function relPath(path: string): string {
    const at = path.indexOf(DIR_MARKER);
    return at === -1 ? path.replace(/^.*\//, '') : path.slice(at + DIR_MARKER.length);
}

/** Parse one glob key into its discovery facts. */
export function parsePrototypePath(path: string): ParsedPrototypePath {
    const rel = relPath(path);
    const parts = rel.split('/');
    const isExcluded = parts.slice(0, -1).some((seg) => seg.startsWith('_'));
    const dir = parts.length > 1 ? parts[0] : 'root';
    const base = parts[parts.length - 1].replace(/\.tsx$/, '');
    const m = base.match(/^(ar)?(\d+)-(.*)$/);
    return { dir, slug: m ? m[3] : base, ticket: m ? m[2] : null, isExcluded };
}
