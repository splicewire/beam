import type { OtioItem, OtioTimeline, OtioTrack } from './otio.js';

/**
 * Test fixtures for the timeline widget, in OTIO JSON as `rushing/laravel-timeline-schema` serialises it. The music
 * document has the music projector's shape (research 05 §2): rate 1.0, a form track carrying only markers, then the
 * lanes, clips placed by gaps, each clip's `name` its row id. The video document has the prepared-video compiler's
 * shape (§6): rate 24 everywhere, one video track of clips and gaps, two audio tracks, no markers. Names and ids are
 * fixtures.
 */

const t = (value: number, rate: number) => ({ OTIO_SCHEMA: 'RationalTime.1', value, rate });
const range = (start: number, duration: number, rate: number) => ({ OTIO_SCHEMA: 'TimeRange.1', start_time: t(start, rate), duration: t(duration, rate) });
const clip = (name: string, duration: number, rate: number, metadata: Record<string, unknown> = {}): OtioItem => ({
    OTIO_SCHEMA: 'Clip.2',
    name,
    metadata,
    source_range: range(0, duration, rate),
    media_references: { DEFAULT_MEDIA: { OTIO_SCHEMA: 'MissingReference.1', name: '' } },
    active_media_reference_key: 'DEFAULT_MEDIA',
});
const gap = (duration: number, rate: number): OtioItem => ({ OTIO_SCHEMA: 'Gap.1', name: '', metadata: {}, source_range: range(0, duration, rate) });
const track = (name: string, kind: string, children: OtioItem[], markers?: OtioTrack['markers']): OtioTrack => ({
    OTIO_SCHEMA: 'Track.1',
    name,
    kind,
    metadata: {},
    ...(markers ? { markers } : {}),
    children,
});

/** Two sections (verse 0-8 s, chorus 8-16 s), a lead lane with one clip per section and a gap, one take of 16 s. */
export const MUSIC_DOC: OtioTimeline = {
    OTIO_SCHEMA: 'Timeline.1',
    name: 'Fixture song',
    metadata: {},
    tracks: {
        OTIO_SCHEMA: 'Stack.1',
        name: 'tracks',
        children: [
            track('Form', 'Audio', [], [
                { OTIO_SCHEMA: 'Marker.2', name: 'Verse', color: 'GREEN', marked_range: range(0, 8, 1), comment: '', metadata: {} },
                { OTIO_SCHEMA: 'Marker.2', name: 'Chorus', color: 'RED', marked_range: range(8, 8, 1), comment: '', metadata: {} },
            ]),
            track('Lead', 'Audio', [
                clip('clip-verse', 6, 1, { fixture: { slots: { notes: ['not read'] } } }),
                gap(2, 1),
                clip('clip-chorus', 8, 1),
            ]),
            track('Takes', 'Audio', [clip('clip-take-1', 16, 1)]),
        ],
    },
};

/** 2 s clip, 1 s gap, 3 s clip on the video track (48, 24 and 72 frames); audio tracks of 6 s and 4 s. */
export const PREPARED_VIDEO_DOC: OtioTimeline = {
    OTIO_SCHEMA: 'Timeline.1',
    name: 'Fixture prepared video',
    metadata: {},
    global_start_time: t(0, 24),
    tracks: {
        OTIO_SCHEMA: 'Stack.1',
        name: 'tracks',
        children: [
            // Two clips cut from one asset share a name: ids must not come from `name`.
            track('Video', 'Video', [clip('asset-a', 48, 24), gap(24, 24), clip('asset-a', 72, 24)]),
            track('Audio 1', 'Audio', [clip('asset-b', 144, 24)]),
            track('Audio 2', 'Audio', [clip('asset-c', 96, 24)]),
        ],
    },
};
