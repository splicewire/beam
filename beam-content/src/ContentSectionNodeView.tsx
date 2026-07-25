import { ChevronDown, ImageIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { NodeViewComponentProps } from '@schemastud/blockdoc/react';

/**
 * Bespoke node-view for the `contentSection` block (composition-authoring-ux
 * ticket 03, graduated from ticket 02's Mode-toggle decision).
 *
 * Replaces the generic `BlockChromeFallback`, which dumped every attr
 * (`heading` / `groundingTokens` / `imagePrompt` / `strategy`) as a raw
 * key-value field — and rendered the heading twice (once as an attr row, once
 * as the section's own heading). Here the heading is the single authored title;
 * the generation provenance (strategy / image prompt / grounding) is demoted to
 * a muted, collapsible context strip; PM-managed child prose renders through
 * `contentRef`.
 *
 * Interactive controls sit inside a `contentEditable={false}` region so
 * ProseMirror doesn't treat their keystrokes as document content; only the
 * `contentRef` passthrough stays editable.
 */
export function ContentSectionNodeView({
    node,
    updateAttrs,
    contentRef,
}: NodeViewComponentProps) {
    const heading = String(node.attrs.heading ?? '');
    const imagePrompt = (node.attrs.imagePrompt as string | null) ?? '';
    const strategy = node.attrs.strategy as string | null;
    const groundingTokens = Array.isArray(node.attrs.groundingTokens)
        ? (node.attrs.groundingTokens as string[])
        : [];

    const hasContext = Boolean(strategy) || Boolean(imagePrompt) || groundingTokens.length > 0;
    const [showContext, setShowContext] = useState(false);

    return (
        <div className="blockdoc-content-section rounded-lg border border-[var(--beam-ink-10)] bg-background">
            {/* Chrome — non-editable so PM leaves these inputs alone. */}
            <div contentEditable={false}>
                    <div className="flex items-center gap-2 px-3.5 pt-2.5">
                        <span className="font-mono text-[9px] font-medium tracking-[0.14em] text-[var(--beam-ink-40)] uppercase">
                            Section
                        </span>
                        {hasContext && (
                            <button
                                type="button"
                                onClick={() => setShowContext((open) => !open)}
                                className="ml-auto flex items-center gap-1 font-mono text-[9.5px] tracking-wide text-[var(--beam-ink-45)] uppercase transition-colors hover:text-foreground"
                            >
                                <Sparkles className="size-3" /> Context
                                <ChevronDown
                                    className={`size-3 transition-transform ${showContext ? 'rotate-180' : ''}`}
                                />
                            </button>
                        )}
                    </div>

                    <input
                        value={heading}
                        onChange={(event) => updateAttrs({ heading: event.target.value })}
                        placeholder="Section heading…"
                        aria-label="Section heading"
                        className="w-full bg-transparent px-3.5 py-1 text-[15px] font-semibold tracking-tight outline-none placeholder:text-[var(--beam-ink-30)]"
                    />

                    {hasContext && showContext && (
                        <div className="mx-3.5 mb-2 space-y-2 rounded-md bg-[var(--beam-ink-04)] p-2.5">
                            {strategy && (
                                <div className="flex items-center gap-2 text-[11px]">
                                    <span className="font-mono tracking-wide text-[var(--beam-ink-45)] uppercase">
                                        Strategy
                                    </span>
                                    <span className="font-medium text-[var(--beam-ink-70)]">
                                        {strategy}
                                    </span>
                                </div>
                            )}
                            <label className="flex items-center gap-2 text-[11px]">
                                <span className="inline-flex shrink-0 items-center gap-1 font-mono tracking-wide text-[var(--beam-ink-45)] uppercase">
                                    <ImageIcon className="size-3" /> Image
                                </span>
                                <input
                                    value={imagePrompt}
                                    onChange={(event) =>
                                        updateAttrs({ imagePrompt: event.target.value || null })
                                    }
                                    placeholder="No image prompt"
                                    className="min-w-0 flex-1 bg-transparent text-[var(--beam-ink-70)] outline-none placeholder:text-[var(--beam-ink-30)]"
                                />
                            </label>
                            {groundingTokens.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="font-mono text-[10px] tracking-wide text-[var(--beam-ink-45)] uppercase">
                                        Grounding
                                    </span>
                                    {groundingTokens.map((token, index) => (
                                        <span
                                            key={`${token}-${index}`}
                                            className="rounded bg-[var(--beam-ink-08)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--beam-ink-60)]"
                                        >
                                            {token}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            {/* PM-managed child prose. */}
            {contentRef !== null && <div ref={contentRef} className="px-3.5 pb-3" />}
        </div>
    );
}
