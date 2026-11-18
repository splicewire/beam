/**
 * `@splicewire/beam-ux/timeline` — the timeline widget (node-actions-and-takes 08), music first. One heavyweight
 * widget that draws an OpenTimelineIO document in frame's edit shell: a section ruler, one row per lane, clips placed
 * by walking gaps, every time as `value / rate`. Writes are the host's ports ({@link TimelinePortsProvider}); a port
 * that is absent hides its control, so the same widget draws a read-only medium (prepared video at 24 fps) unchanged.
 */
export { TimelineWidget } from './TimelineWidget.js';
export type { TimelineWidgetProps } from './TimelineWidget.js';
export { TIMELINE_WIDGET_NAME, registerTimelineWidget } from './widgetRegistry.js';
export { TimelinePortsProvider, useTimelinePorts } from './ports.js';
export type {
    ClipTimeChange,
    TimelineAction,
    TimelineActionResult,
    TimelineNode,
    TimelinePorts,
    TimelineVersion,
    TimelineVersionsPort,
} from './ports.js';
export { layoutTimeline, seconds, itemKind, OtioTimeError, defaultClipId, defaultSectionId } from './otio.js';
export type {
    LaidClip,
    LaidLane,
    LaidSection,
    LaneInfo,
    LayoutOptions,
    OtioItem,
    OtioMarker,
    OtioRationalTime,
    OtioTimeline,
    OtioTimePlace,
    OtioTimeRange,
    OtioTrack,
    TimelineLayout,
} from './otio.js';
