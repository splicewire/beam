// The registration module for the timeline widget (CONFORM 01-2, 04-5, 05-1): one string name, never a predicate,
// and the only cast is the heavyweight narrowing at registration, the same one the canvas makes. A host passes the
// returned registry to <FiveRegionEditShell registry={...} widget={TIMELINE_WIDGET_NAME}> and keeps it at stable
// identity, or the widget remounts and drops its drag and selection state.
import { createWidgetRegistry } from '@schemastud/seam';
import type { ComponentType } from 'react';
import type { WidgetRegistry, WidgetResolution } from '@schemastud/seam';
import { TimelineWidget } from './TimelineWidget.js';
import type { TimelineWidgetProps } from './TimelineWidget.js';

/** The name the timeline registers under: pass it as `<FiveRegionEditShell widget={TIMELINE_WIDGET_NAME}>`. */
export const TIMELINE_WIDGET_NAME = 'otio-timeline';

/** Registers the timeline widget into `registry` (or a new one) and returns it. */
export function registerTimelineWidget(
    registry: WidgetRegistry = createWidgetRegistry(),
    widget: ComponentType<TimelineWidgetProps> = TimelineWidget,
): WidgetRegistry {
    // A full-surface (heavyweight) widget takes frame's HeavyweightWidgetProps, not RJSF's WidgetProps, so it
    // registers through the heavyweight narrowing that frame's WidgetSurface reverses at its one mount.
    registry.registerWidget(TIMELINE_WIDGET_NAME, widget as unknown as WidgetResolution);
    return registry;
}

export default registerTimelineWidget;
