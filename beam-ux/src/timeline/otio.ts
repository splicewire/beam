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

import { NoticeError, notice } from '../message-descriptor.js';

export interface OtioRationalTime {
    OTIO_SCHEMA?: string;
    value: number;
    rate: number;
}

export interface OtioTimeRange {
    OTIO_SCHEMA?: string;
    start_time: OtioRationalTime;
    duration: OtioRationalTime;
}

export interface OtioMarker {
    OTIO_SCHEMA: string;
    name: string;
    color?: string | null;
    marked_range?: OtioTimeRange;
    comment?: string | null;
    metadata?: Record<string, unknown>;
}

export interface OtioItem {
    OTIO_SCHEMA: string;
    name: string;
    metadata?: Record<string, unknown>;
    source_range?: OtioTimeRange;
    media_references?: Record<string, unknown> | unknown[];
    active_media_reference_key?: string | null;
    markers?: OtioMarker[];
}

export interface OtioTrack {
    OTIO_SCHEMA: string;
    name: string;
    kind?: string;
    metadata?: Record<string, unknown>;
    markers?: OtioMarker[];
    children: OtioItem[];
}

export interface OtioTimeline {
    OTIO_SCHEMA: string;
    name: string;
    metadata?: Record<string, unknown>;
    global_start_time?: OtioRationalTime;
    tracks: { OTIO_SCHEMA?: string; name?: string; children: OtioTrack[]; markers?: OtioMarker[] };
}

/** `Clip.2` → `clip`, `Gap.1` → `gap`, anything else → `null` (drawn as nothing, never guessed). */
export function itemKind(item: OtioItem): 'clip' | 'gap' | null {
    const schema = item.OTIO_SCHEMA.split('.')[0];
    return schema === 'Clip' ? 'clip' : schema === 'Gap' ? 'gap' : null;
}

/**
 * An unreadable time, as a catalog line: the widget renders its `notice` in the reader's locale; its `message` stays
 * English for logs.
 */
export class OtioTimeError extends NoticeError {}

/** Where an unreadable time sits, for the error that names it. */
export type OtioTimePlace = { kind: 'section'; name: string } | { kind: 'clip'; name: string; track: string } | { kind: 'gap'; track: string };

const NO_TIME = {
    section: 'splicewire-beam-ux::messages.timeline_section_no_time',
    clip: 'splicewire-beam-ux::messages.timeline_clip_no_time',
    gap: 'splicewire-beam-ux::messages.timeline_gap_no_time',
} as const;
const NO_RATE = {
    section: 'splicewire-beam-ux::messages.timeline_section_no_rate',
    clip: 'splicewire-beam-ux::messages.timeline_clip_no_rate',
    gap: 'splicewire-beam-ux::messages.timeline_gap_no_rate',
} as const;

/** Seconds of one OTIO time: `value / rate`, read from the value itself. */
export function seconds(time: OtioRationalTime | undefined, where: OtioTimePlace): number {
    const { kind, ...parameters } = where;
    if (!time || typeof time.value !== 'number' || !Number.isFinite(time.value)) {
        throw new OtioTimeError(notice(NO_TIME[kind], parameters));
    }
    if (typeof time.rate !== 'number' || !Number.isFinite(time.rate) || time.rate <= 0) {
        throw new OtioTimeError(notice(NO_RATE[kind], parameters));
    }
    return time.value / time.rate;
}

/** What the host says about one track (its ports). The document does not say any of it. */
export interface LaneInfo {
    /** A lead lane: its clips may be moved and trimmed through `patchClip`. Default false. */
    editable?: boolean;
    /** The lane that holds finished recordings: never edited, and the source of a section action's choices. */
    take?: boolean;
    /** The lane whose markers are the section ruler (drawn as the ruler, not as a row). */
    form?: boolean;
    /** Replaces the track's name as the row label. */
    label?: string;
}

export interface LaidClip {
    id: string;
    kind: 'clip';
    name: string;
    start: number;
    duration: number;
    laneIndex: number;
    itemIndex: number;
    item: OtioItem;
}

export interface LaidLane {
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

export interface LaidSection {
    id: string;
    name: string;
    start: number;
    duration: number;
    color: string | null;
    marker: OtioMarker;
}

export interface TimelineLayout {
    /** Seconds from the start to the end of the longest lane or section. */
    duration: number;
    sections: LaidSection[];
    lanes: LaidLane[];
}

export interface LayoutOptions {
    lane?: (track: OtioTrack, index: number) => LaneInfo;
    /** A clip's node id. Default: its lane and item index, since a clip's `name` need not be unique. */
    clipId?: (item: OtioItem, laneIndex: number, itemIndex: number, track: OtioTrack) => string;
    /** A section's node id. Default: its marker index. */
    sectionId?: (marker: OtioMarker, index: number) => string;
}

export const defaultClipId = (_item: OtioItem, laneIndex: number, itemIndex: number) => `lane:${laneIndex}/item:${itemIndex}`;
export const defaultSectionId = (_marker: OtioMarker, index: number) => `section:${index}`;

/** A track with markers and no clip is the section ruler, unless the host says otherwise. */
function isFormByShape(track: OtioTrack): boolean {
    return (track.markers?.length ?? 0) > 0 && !track.children.some((item) => itemKind(item) === 'clip');
}

/**
 * Lays the document out in seconds: clips placed by walking each lane's items in order (gaps move the cursor,
 * clips sit at it), sections from the form lane's markers.
 */
export function layoutTimeline(doc: OtioTimeline, options: LayoutOptions = {}): TimelineLayout {
    const clipId = options.clipId ?? defaultClipId;
    const sectionId = options.sectionId ?? defaultSectionId;
    const tracks = doc.tracks?.children ?? [];
    const lanes: LaidLane[] = [];
    const sections: LaidSection[] = [];
    let duration = 0;

    tracks.forEach((track, index) => {
        const info = options.lane?.(track, index) ?? {};
        const form = info.form ?? isFormByShape(track);

        if (form) {
            for (const marker of track.markers ?? []) {
                const place = { kind: 'section', name: marker.name } as const;
                const start = seconds(marker.marked_range?.start_time, place);
                const length = seconds(marker.marked_range?.duration, place);
                sections.push({ id: sectionId(marker, sections.length), name: marker.name, start, duration: length, color: marker.color ?? null, marker });
                duration = Math.max(duration, start + length);
            }
            return;
        }

        let cursor = 0;
        const clips: LaidClip[] = [];
        track.children.forEach((item, itemIndex) => {
            const kind = itemKind(item);
            if (kind === null) return;
            const length = seconds(item.source_range?.duration, kind === 'gap' ? { kind, track: track.name } : { kind, name: item.name, track: track.name });
            if (kind === 'clip') {
                clips.push({ id: clipId(item, index, itemIndex, track), kind, name: item.name, start: cursor, duration: length, laneIndex: index, itemIndex, item });
            }
            cursor += length;
        });
        duration = Math.max(duration, cursor);
        lanes.push({
            id: `lane:${index}`,
            index,
            name: track.name,
            label: info.label ?? track.name,
            kind: track.kind ?? null,
            editable: info.editable === true && info.take !== true,
            take: info.take === true,
            clips,
            track,
        });
    });

    return { duration, sections, lanes };
}
