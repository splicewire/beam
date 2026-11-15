/**
 * The one Frame socket this host talks to, in every realm. It is named EXPLICITLY because frame 0.6.0 moved its own default to
 * `/stud/frame` (owner-review 13e, condition A) while the hosts that mount this console still serve only the session socket at
 * `/frame` for it (laravel-tower-starter routes/web.php: no `stud/frame` root outside the tenant boundary). Taking frame's default
 * left this host split: the manifest on one root, every resource request on the other.
 *
 * Pinned to `/frame` until the console moves (ticket 10 / owner-review 16): that move is this ONE constant, and
 * `frame/no-split-frame-root.test.ts` then flags every literal still on the old root.
 */
export const FRAME_PREFIX = '/frame';

/** The root realm's manifest URL, derived from the prefix (a realm mount may pass its own). */
export const FRAME_MANIFEST_URL = `${FRAME_PREFIX}/manifest`;
