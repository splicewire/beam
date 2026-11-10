// The @schemastud/seam WidgetRegistry a host passes to <FiveRegionEditShell registry={...}>, pre-
// registered with everything the canvas needs: the heavyweight canvas widget itself (under
// CANVAS_WIDGET_NAME) plus its two attrsSchema custom widgets (class-chips / style-rows). A host
// extends the returned registry with its own registerWidget() calls if it wants more (e.g. a custom
// x-widget for some other attr) — it never needs to register these three itself.
//
// `canvasWidget` is parametrized (not just the plain exported CanvasWidget) because
// FiveRegionEditShell/WidgetSurface never forward an `onChange` to the mounted widget — it's built
// for a self-persisting widget, not a `value`/`onChange` controlled one. VisualEditor.tsx registers
// its OWN stable-identity wrapper that closes over a ref to the live onChange instead (see there for
// why identity must stay stable across renders — a fresh registry each render would remount the
// widget, and with it every bit of local canvas state: text-edit focus, drag state, the open menu).
import { createWidgetRegistry } from '@schemastud/seam';
import type { ComponentType } from 'react';
import type { WidgetRegistry, WidgetResolution } from '@schemastud/seam';
import { CanvasWidget } from './CanvasWidget.js';
import type { CanvasWidgetProps } from './CanvasWidget.js';
import { ClassChipsWidget, StyleRowsWidget } from './widgets.js';

/** The `x-widget` / `widget` name the canvas registers under — pass this as
 * `<FiveRegionEditShell widget={CANVAS_WIDGET_NAME}>`. */
export const CANVAS_WIDGET_NAME = 'beam-ux-canvas';

export function createCanvasWidgetRegistry(
    canvasWidget: ComponentType<CanvasWidgetProps> = CanvasWidget,
): WidgetRegistry {
    const registry = createWidgetRegistry();
    registry.registerWidget('class-chips', ClassChipsWidget);
    registry.registerWidget('style-rows', StyleRowsWidget);
    // The canvas is a full-surface (heavyweight) editor: it takes frame's HeavyweightWidgetProps, not RJSF's
    // WidgetProps, so it is neither a Widget nor a Field. It registers through the heavyweight narrowing, which
    // frame's WidgetSurface reverses at its one mount (ruling 04 §5-6; the pattern 34 accepted for frame's harness).
    // The target is seam's own WidgetResolution, so the narrowing names the registry's RJSF copy, never beam's.
    registry.registerWidget(CANVAS_WIDGET_NAME, canvasWidget as unknown as WidgetResolution);
    return registry;
}
