import { createContext, useContext, type ReactNode } from 'react';
import type { LaidClip, LaidSection, LayoutOptions, OtioItem, OtioTimeline } from './otio.js';

/**
 * The timeline widget's ports (node-actions-and-takes 08; research 05 §3 "The written contract"). The host gives them
 * through {@link TimelinePortsProvider}, because the edit shell passes a heavyweight widget no callbacks. The widget
 * imports no route, no hook and no fetch: every read after the first and every write is a port, and a port that is
 * absent hides its control. That is what lets one widget serve a medium that can only be read.
 */

/** The only fields a person may change on a clip: where it starts and how long it is, in seconds. */
export interface ClipTimeChange {
    startSeconds?: number;
    durationSeconds?: number;
}

/** A node the person has selected. */
export type TimelineNode = { kind: 'clip'; clip: LaidClip; editable: boolean; take: boolean } | { kind: 'section'; section: LaidSection };

/** What an action's `run` answers: the words to show, e.g. "Queued". */
export interface TimelineActionResult {
    message: string;
}

/**
 * One action the host offers for a selected node. With `unavailable` set, the control is not drawn and the reason is
 * shown in its place. With `choices`, the person picks one (for example the source recording) before running it.
 */
export interface TimelineAction {
    key: string;
    label: string;
    unavailable?: string;
    choices?: { value: string; label: string }[];
    choiceLabel?: string;
    run(choice: string | undefined): Promise<TimelineActionResult>;
}

export interface TimelineVersion {
    ref: string;
    label?: string | null;
    createdAt?: string | null;
    head?: boolean;
}

export interface TimelineVersionsPort {
    list(): Promise<TimelineVersion[]>;
    snapshot(label: string): Promise<unknown>;
    restore(ref: string): Promise<unknown>;
}

export interface TimelinePorts extends LayoutOptions {
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

const PortsContext = createContext<TimelinePorts>({});

/** Gives the timeline widget its ports. Keep `value` at stable identity, as a registry is. */
export function TimelinePortsProvider({ value, children }: { value: TimelinePorts; children: ReactNode }) {
    return <PortsContext.Provider value={value}>{children}</PortsContext.Provider>;
}

export function useTimelinePorts(): TimelinePorts {
    return useContext(PortsContext);
}
