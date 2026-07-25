import type { NodeViewRegistry } from '@schemastud/blockdoc/react';
import { ContentOutlineNodeView } from './ContentOutlineNodeView';
import { ContentSectionNodeView } from './ContentSectionNodeView';

/**
 * Register the `content` profile's bespoke NodeViews on a host `nodeViewRegistry` — the single
 * wiring seam a host calls at bootstrap. Node names are the runtime (snake_case) block names the
 * served content manifest uses (`content_section` / `content_outline`), NOT the fixture camelCase.
 * Later registrations replace earlier ones, so a host can still override a specific node afterward.
 */
export function registerContentNodeViews(registry: NodeViewRegistry): void {
    registry.registerNodeView('content_section', ContentSectionNodeView);
    registry.registerNodeView('content_outline', ContentOutlineNodeView);
}
