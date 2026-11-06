/**
 * Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast.
 *
 * Reads the CURRENT mode, not just subsequent changes — see {@link editModeStore}. `false` on the
 * server, where there is no host and no broadcast.
 */
declare function useEditMode(): boolean;
/** Test seam: forget the remembered mode. Nothing in a running app resets it; a suite must. */
declare function __resetEditMode(): void;

export { __resetEditMode as _, useEditMode as u };
