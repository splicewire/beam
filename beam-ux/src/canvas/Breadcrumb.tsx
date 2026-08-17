// The selection breadcrumb — the ancestor chain from doc root down to the selected node, each segment
// clickable to select that ancestor. Standalone (not nested in Inspector) since it needs the whole doc
// + path, not just the selected block, and it drives selection rather than editing it.
import { getAt, isJsonBlock } from '../blockdoc/json.js';
import type { JsonDoc } from '../blockdoc/json.js';

export interface BreadcrumbProps {
    doc: JsonDoc;
    /** The selected node's path. */
    path: string;
    onSelect: (path: string) => void;
}

/** A block's breadcrumb label — its tag/component name, or a generic fallback for a text/opaque node. */
function labelFor(doc: JsonDoc, path: string): string {
    const node = getAt(doc, path);
    if (!node) return '?';
    if (isJsonBlock(node)) return node.name ?? 'fragment';
    return node.kind;
}

export function Breadcrumb({ doc, path, onSelect }: BreadcrumbProps) {
    const segments = path.split('.').map((_, i, arr) => arr.slice(0, i + 1).join('.'));

    return (
        <nav className="ve-crumbs" aria-label="Selection path">
            {segments.map((p, i) => (
                <span key={p} className="ve-crumb-seg">
                    {i > 0 && <span className="ve-crumb-sep">/</span>}
                    <button
                        className="ve-crumb"
                        disabled={p === path}
                        onClick={() => onSelect(p)}
                        title={p === path ? undefined : `Select ${labelFor(doc, p)}`}
                    >
                        {labelFor(doc, p)}
                    </button>
                </span>
            ))}
        </nav>
    );
}
