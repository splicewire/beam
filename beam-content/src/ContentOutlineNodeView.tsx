import { ListTree, Plus, X } from 'lucide-react';
import type { NodeViewComponentProps } from '@schemastud/blockdoc/react';

/**
 * Bespoke node-view for the `content_outline` block — the article plan (title + one-line excerpt +
 * an ordered list of section headings the interpreter expands into sections). It is a LEAF node
 * (no child prose), so without a NodeView it fell through to blockdoc's generic `BlockChromeFallback`,
 * which dumped `title` / `excerpt` / `sectionHeadings` as raw key-value attr rows. This renders them
 * as an editable outline instead — clean, inline, WYSIWYG — matching {@link ContentSectionNodeView}.
 *
 * All controls live in a `contentEditable={false}` region so ProseMirror never treats their
 * keystrokes as document content; attrs are patched through `updateAttrs` (id-preserving merge).
 */
export function ContentOutlineNodeView({ node, updateAttrs }: NodeViewComponentProps) {
    const title = String(node.attrs.title ?? '');
    const excerpt = String(node.attrs.excerpt ?? '');
    const headings = Array.isArray(node.attrs.sectionHeadings)
        ? (node.attrs.sectionHeadings as string[])
        : [];

    const setHeadings = (next: string[]) => updateAttrs({ sectionHeadings: next });

    return (
        <div className="blockdoc-content-outline rounded-lg border border-[var(--splice-ink-10)] bg-background" contentEditable={false}>
            <div className="flex items-center gap-2 px-3.5 pt-2.5">
                <span className="inline-flex items-center gap-1 font-mono text-[9px] font-medium tracking-[0.14em] text-[var(--splice-ink-40)] uppercase">
                    <ListTree className="size-3" /> Outline
                </span>
            </div>

            <input
                value={title}
                onChange={(event) => updateAttrs({ title: event.target.value })}
                placeholder="Article title…"
                aria-label="Article title"
                className="w-full bg-transparent px-3.5 py-1 text-[15px] font-semibold tracking-tight outline-none placeholder:text-[var(--splice-ink-30)]"
            />
            <input
                value={excerpt}
                onChange={(event) => updateAttrs({ excerpt: event.target.value })}
                placeholder="A one-line excerpt…"
                aria-label="Excerpt"
                className="w-full bg-transparent px-3.5 pb-1.5 text-[13px] text-[var(--splice-ink-60)] outline-none placeholder:text-[var(--splice-ink-30)]"
            />

            <ol className="space-y-1 px-3.5 pb-3">
                {headings.map((heading, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-right font-mono text-[11px] text-[var(--splice-ink-35)]">
                            {index + 1}.
                        </span>
                        <input
                            value={heading}
                            onChange={(event) => {
                                const next = [...headings];
                                next[index] = event.target.value;
                                setHeadings(next);
                            }}
                            placeholder="Section heading…"
                            aria-label={`Section heading ${index + 1}`}
                            className="min-w-0 flex-1 rounded border border-transparent bg-[var(--splice-ink-04)] px-2 py-1 text-[13px] outline-none focus:border-[var(--splice-ink-15)] placeholder:text-[var(--splice-ink-30)]"
                        />
                        <button
                            type="button"
                            onClick={() => setHeadings(headings.filter((_, i) => i !== index))}
                            aria-label={`Remove section ${index + 1}`}
                            className="shrink-0 rounded p-1 text-[var(--splice-ink-40)] transition-colors hover:bg-[var(--splice-ink-08)] hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    </li>
                ))}
                <li>
                    <button
                        type="button"
                        onClick={() => setHeadings([...headings, ''])}
                        className="ml-7 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--splice-green)] transition-colors hover:underline"
                    >
                        <Plus className="size-3.5" /> Add section
                    </button>
                </li>
            </ol>
        </div>
    );
}
