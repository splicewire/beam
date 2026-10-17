import type { NodeViewRegistry } from '@schemastud/blockdoc/react';
import { ContentOutlineNodeView } from './ContentOutlineNodeView';
import { ContentSectionNodeView } from './ContentSectionNodeView';

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
export function registerContentNodeViews(registry: NodeViewRegistry): void {
    registry.registerNodeView('ContentSection', ContentSectionNodeView);
    registry.registerNodeView('ContentOutline', ContentOutlineNodeView);
    registry.registerNodeView('content_section', ContentSectionNodeView);
    registry.registerNodeView('content_outline', ContentOutlineNodeView);
}
