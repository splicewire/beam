import * as react from 'react';
import { B as BeamUxMessages } from './messages-iwWTtwOl.js';
import '@schemastud/messages';

/**
 * The takes strip's input (node-actions-and-takes 06): a VIEW MODEL its host maps from the shared take read
 * projection (the composition spine's discriminated revision | artifact). The host owns the words, the excerpt and
 * which actions exist, so a surface keeps its own vocabulary; the strip only draws. Coord ruled the shape 2026-11-15
 * 01:39Z: a fingerprint is a flat label/value list and null means "not recorded"; ids are strings; a revision offers
 * revert only, and an artifact's keep is the host's existing choose operation or is absent.
 */
/** One take of a node. */
interface StripTake {
    /** Unique within the strip (a revision id and an artifact id may be equal, so a host prefixes). */
    key: string;
    /** `revision`: a payload a change replaced. `artifact`: a rendered output that references the node. */
    kind: 'revision' | 'artifact';
    /** What produced it, in the host's words, e.g. "Before a refine" or "Music take · eleven_music_v1". */
    title: string;
    /** When it was recorded or completed (ISO 8601), or null. */
    at: string | null;
    /** A short plain-text excerpt of the take, when there is one. */
    excerpt?: string;
    /** A playable or viewable result. The strip draws a native player for it. */
    audition?: {
        url: string;
        medium: 'audio' | 'video' | 'image';
    };
    /** What steered it, when a steering fingerprint is stored; null when none is (shown as not recorded). */
    fingerprint: Array<{
        label: string;
        value: string;
    }> | null;
    canRevert: boolean;
    canKeep: boolean;
}
/** The strip's words, all the host's, so a surface keeps its own vocabulary. */
interface StripLabels {
    /** The section's accessible name, e.g. "Takes of this verse". */
    region: string;
    /** The visible heading. Default "Takes". */
    heading?: string;
    /** Shown when there are no takes. */
    empty: string;
    /** A standing note beside the heading, e.g. what a regenerate does not keep. */
    note?: string;
    /** The revert button. Default "Use this take". */
    revert?: string;
    /** The keep button. Default "Keep this take". */
    keep?: string;
    /** While the takes load. Default "Loading takes…". */
    loading?: string;
    /** Shown in place of fingerprints when none was stored. Default "Steering not recorded". */
    noFingerprint?: string;
}

/**
 * "just now", "3m ago", "2h ago", then a short date: the wording Studio's takes list uses, from beam-ux's catalog.
 * A render passes the reader's messages; without them the words are English. The date is the reader's locale too
 * (the messages' formatter, never the browser's).
 */
declare function relativeWhen(iso: string | null, now?: number, m?: BeamUxMessages): string;
interface TakesStripProps {
    takes: StripTake[] | undefined;
    labels: StripLabels;
    /** The takes are loading. */
    pending?: boolean;
    /** The read failed: shown in place of the list, in the host's words. */
    error?: string | null;
    /** An action is out (or the node is held): no other one can start. */
    busy?: boolean;
    /** An action failed, in the host's words. */
    actionError?: string | null;
    onRevert?: (take: StripTake) => void;
    onKeep?: (take: StripTake) => void;
    className?: string;
}
/**
 * The takes of one node, newest first, drawn from the host's view model (node-actions-and-takes 06): what produced
 * each, when, an excerpt, a player for a rendered result, what steered it (or that nothing was recorded), and the
 * actions the host allows. It reads nothing and decides nothing: the host maps the shared take read to
 * {@link StripTake} and performs the actions.
 */
declare function TakesStrip({ takes, labels, pending, error, busy, actionError, onRevert, onKeep, className }: TakesStripProps): react.JSX.Element;

export { type StripLabels, type StripTake, TakesStrip, type TakesStripProps, relativeWhen };
