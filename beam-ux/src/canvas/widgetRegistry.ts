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
import type { WidgetRegistry } from '@schemastud/seam';
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
    registry.registerWidget(CANVAS_WIDGET_NAME, canvasWidget);
    return registry;
}
