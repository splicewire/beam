import * as react from 'react';
import { NodeViewComponentProps, NodeViewRegistry } from '@schemastud/blockdoc/react';

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
declare function ContentSectionNodeView({ node, updateAttrs, contentRef, }: NodeViewComponentProps): react.JSX.Element;

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
declare function ContentOutlineNodeView({ node, updateAttrs }: NodeViewComponentProps): react.JSX.Element;

/**
 * Register the `content` profile's bespoke NodeViews on a host `nodeViewRegistry` — the single
 * wiring seam a host calls at bootstrap. Post-EP-07c the block names are the PascalCase JSX tags
 * the served content manifest declares (`ContentSection` / `ContentOutline`; ADR-0228 d6).
 *
 * EP-07c READ-COMPAT: each NodeView is ALSO registered under its pre-07c snake name
 * (`content_section` / `content_outline`), so a document stored before EP-07c C's slots migration
 * — which may still hold the old name if it reaches the registry without the editor's
 * normalize-on-load — still resolves its NodeView. The dual registration (distinct keys, both
 * kept) is removed once every host has migrated (tracked in ticket 00). Later registrations
 * replace earlier ones, so a host can still override a specific node afterward.
 */
declare function registerContentNodeViews(registry: NodeViewRegistry): void;

export { ContentOutlineNodeView, ContentSectionNodeView, registerContentNodeViews };
