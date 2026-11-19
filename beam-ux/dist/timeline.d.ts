import * as react from 'react';
import { ComponentType, ReactNode } from 'react';
import { HeavyweightWidgetProps } from '@schemastud/frame/editor';
import { N as NoticeError } from './message-descriptor-Dg2DKMSC.js';
import { WidgetRegistry } from '@schemastud/seam';
import './messages-BdyXoTNM.js';
import '@schemastud/messages';

/**
 * The OTIO reading the timeline widget does (node-actions-and-takes 08). These are the generic OpenTimelineIO JSON
 * shapes as `rushing/laravel-timeline-schema` serialises them (`Timeline.1` → `Stack.1` → `Track.1` → `Clip.2` /
 * `Gap.1`, `Marker.2` on a track, every time a `RationalTime.1`). They are a structural reader, not a host's declared
 * shape: what a host adds in `metadata` is the host's, and reaches the widget only through its ports.
 *
 * Every time is `value / rate` seconds, read from each value. A time without a rate is an error, never a default:
 * the schema class defaults its rate to 24, so treating a missing rate as seconds would be wrong for video and an
 * assumption for music (research 05 §6).
 */

interface OtioRationalTime {
    OTIO_SCHEMA?: string;
    value: number;
    rate: number;
}
interface OtioTimeRange {
    OTIO_SCHEMA?: string;
    start_time: OtioRationalTime;
    duration: OtioRationalTime;
}
interface OtioMarker {
    OTIO_SCHEMA: string;
    name: string;
    color?: string | null;
    marked_range?: OtioTimeRange;
    comment?: string | null;
    metadata?: Record<string, unknown>;
}
interface OtioItem {
    OTIO_SCHEMA: string;
    name: string;
    metadata?: Record<string, unknown>;
    source_range?: OtioTimeRange;
    media_references?: Record<string, unknown> | unknown[];
    active_media_reference_key?: string | null;
    markers?: OtioMarker[];
}
interface OtioTrack {
    OTIO_SCHEMA: string;
    name: string;
    kind?: string;
    metadata?: Record<string, unknown>;
    markers?: OtioMarker[];
    children: OtioItem[];
}
interface OtioTimeline {
    OTIO_SCHEMA: string;
    name: string;
    metadata?: Record<string, unknown>;
    global_start_time?: OtioRationalTime;
    tracks: {
        OTIO_SCHEMA?: string;
        name?: string;
        children: OtioTrack[];
        markers?: OtioMarker[];
    };
}
/** `Clip.2` → `clip`, `Gap.1` → `gap`, anything else → `null` (drawn as nothing, never guessed). */
declare function itemKind(item: OtioItem): 'clip' | 'gap' | null;
/**
 * An unreadable time, as a catalog line: the widget renders its `notice` in the reader's locale; its `message` stays
 * English for logs.
 */
declare class OtioTimeError extends NoticeError {
}
/** Where an unreadable time sits, for the error that names it. */
type OtioTimePlace = {
    kind: 'section';
    name: string;
} | {
    kind: 'clip';
    name: string;
    track: string;
} | {
    kind: 'gap';
    track: string;
};
/** Seconds of one OTIO time: `value / rate`, read from the value itself. */
declare function seconds(time: OtioRationalTime | undefined, where: OtioTimePlace): number;
/** What the host says about one track (its ports). The document does not say any of it. */
interface LaneInfo {
    /** A lead lane: its clips may be moved and trimmed through `patchClip`. Default false. */
    editable?: boolean;
    /** The lane that holds finished recordings: never edited, and the source of a section action's choices. */
    take?: boolean;
    /** The lane whose markers are the section ruler (drawn as the ruler, not as a row). */
    form?: boolean;
    /** Replaces the track's name as the row label. */
    label?: string;
}
interface LaidClip {
    id: string;
    kind: 'clip';
    name: string;
    start: number;
    duration: number;
    laneIndex: number;
    itemIndex: number;
    item: OtioItem;
}
interface LaidLane {
    id: string;
    index: number;
    name: string;
    label: string;
    kind: string | null;
    editable: boolean;
    take: boolean;
    clips: LaidClip[];
    track: OtioTrack;
}
interface LaidSection {
    id: string;
    name: string;
    start: number;
    duration: number;
    color: string | null;
    marker: OtioMarker;
}
interface TimelineLayout {
    /** Seconds from the start to the end of the longest lane or section. */
    duration: number;
    sections: LaidSection[];
    lanes: LaidLane[];
}
interface LayoutOptions {
    lane?: (track: OtioTrack, index: number) => LaneInfo;
    /** A clip's node id. Default: its lane and item index, since a clip's `name` need not be unique. */
    clipId?: (item: OtioItem, laneIndex: number, itemIndex: number, track: OtioTrack) => string;
    /** A section's node id. Default: its marker index. */
    sectionId?: (marker: OtioMarker, index: number) => string;
}
declare const defaultClipId: (_item: OtioItem, laneIndex: number, itemIndex: number) => string;
declare const defaultSectionId: (_marker: OtioMarker, index: number) => string;
/**
 * Lays the document out in seconds: clips placed by walking each lane's items in order (gaps move the cursor,
 * clips sit at it), sections from the form lane's markers.
 */
declare function layoutTimeline(doc: OtioTimeline, options?: LayoutOptions): TimelineLayout;

/**
 * The timeline widget (node-actions-and-takes 08), registered as `otio-timeline`. It draws one OTIO document: a
 * section ruler from the form lane's markers, one row per other lane, clips placed by walking gaps, every time as
 * `value / rate`. It selects through the edit shell's mount, moves and trims lead-lane clips through the host's
 * `patchClip` port, runs the host's actions for a selection, and lists, snapshots and restores versions.
 *
 * Frame's full-surface contract (`HeavyweightWidgetProps`, CONFORM 04-1/04-4), optional because a host may also render
 * it directly. The lock is `readonly`: when set, the widget draws and selects and calls no write port.
 *
 * It never reads a clip's notes, never sends `status`, `mediaTargetUrl` or `payload`, never moves a marker or a clip
 * on the take lane, never creates, deletes or reorders anything, and never keeps the document as truth: after a write
 * it calls the host's `load` and redraws.
 */
interface TimelineWidgetProps extends Partial<HeavyweightWidgetProps<OtioTimeline>> {
    /** Pixels per second. Default 48. */
    scale?: number;
}
declare function TimelineWidget({ value, formData, editShellMount: mount, readonly, scale }: TimelineWidgetProps): react.JSX.Element;

/** The name the timeline registers under: pass it as `<FiveRegionEditShell widget={TIMELINE_WIDGET_NAME}>`. */
declare const TIMELINE_WIDGET_NAME = "otio-timeline";
/** Registers the timeline widget into `registry` (or a new one) and returns it. */
declare function registerTimelineWidget(registry?: WidgetRegistry, widget?: ComponentType<TimelineWidgetProps>): WidgetRegistry;

/**
 * The timeline widget's ports (node-actions-and-takes 08; research 05 §3 "The written contract"). The host gives them
 * through {@link TimelinePortsProvider}, because the edit shell passes a heavyweight widget no callbacks. The widget
 * imports no route, no hook and no fetch: every read after the first and every write is a port, and a port that is
 * absent hides its control. That is what lets one widget serve a medium that can only be read.
 */
/** The only fields a person may change on a clip: where it starts and how long it is, in seconds. */
interface ClipTimeChange {
    startSeconds?: number;
    durationSeconds?: number;
}
/** A node the person has selected. */
type TimelineNode = {
    kind: 'clip';
    clip: LaidClip;
    editable: boolean;
    take: boolean;
} | {
    kind: 'section';
    section: LaidSection;
};
/** What an action's `run` answers: the words to show, e.g. "Queued". */
interface TimelineActionResult {
    message: string;
}
/**
 * One action the host offers for a selected node. With `unavailable` set, the control is not drawn and the reason is
 * shown in its place. With `choices`, the person picks one (for example the source recording) before running it.
 */
interface TimelineAction {
    key: string;
    label: string;
    unavailable?: string;
    choices?: {
        value: string;
        label: string;
    }[];
    choiceLabel?: string;
    run(choice: string | undefined): Promise<TimelineActionResult>;
}
interface TimelineVersion {
    ref: string;
    label?: string | null;
    createdAt?: string | null;
    head?: boolean;
}
interface TimelineVersionsPort {
    list(): Promise<TimelineVersion[]>;
    snapshot(label: string): Promise<unknown>;
    restore(ref: string): Promise<unknown>;
}
interface TimelinePorts extends LayoutOptions {
    /** Re-reads the document. Called after every write and after a restore. */
    load?: () => Promise<OtioTimeline>;
    /** Moves or trims one clip. Only `startSeconds` and `durationSeconds` are ever sent. */
    patchClip?: (clipId: string, change: ClipTimeChange) => Promise<unknown>;
    /** The actions for a selected node. */
    actionsFor?: (node: TimelineNode, doc: OtioTimeline) => TimelineAction[];
    versions?: TimelineVersionsPort;
    /** Real peaks for a clip with media, or null. Without peaks a clip is a plain bar, never a decorative wave. */
    peaksFor?: (clip: OtioItem) => number[] | null;
    /** Snap a moved or trimmed time to this many seconds (video: 1/24). Default: no snapping. */
    snapSeconds?: number;
}
/** Gives the timeline widget its ports. Keep `value` at stable identity, as a registry is. */
declare function TimelinePortsProvider({ value, children }: {
    value: TimelinePorts;
    children: ReactNode;
}): react.JSX.Element;
declare function useTimelinePorts(): TimelinePorts;

export { type ClipTimeChange, type LaidClip, type LaidLane, type LaidSection, type LaneInfo, type LayoutOptions, type OtioItem, type OtioMarker, type OtioRationalTime, OtioTimeError, type OtioTimePlace, type OtioTimeRange, type OtioTimeline, type OtioTrack, TIMELINE_WIDGET_NAME, type TimelineAction, type TimelineActionResult, type TimelineLayout, type TimelineNode, type TimelinePorts, TimelinePortsProvider, type TimelineVersion, type TimelineVersionsPort, TimelineWidget, type TimelineWidgetProps, defaultClipId, defaultSectionId, itemKind, layoutTimeline, registerTimelineWidget, seconds, useTimelinePorts };
