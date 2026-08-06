/**
 * `@splicewire/beam-ux/shell` — the OS-shell layer (beam-ux-uplift ticket 11; the ticket-03 spike
 * made real). The capstone that FRAMES the already-promoted seams — it invents no substrate.
 *
 * A generic desktop chrome so a host mounts one component and gets a desktop of realms:
 *   - {@link Shell} — menu bar (system/realm status) + dock + launcher (start-menu) + window
 *     manager (open / focus / minimize / close), with a deliberate single-app compact mode on
 *     small screens.
 *   - {@link useWindowManager} / {@link windowManagerReducer} — the pure window-manager state core.
 *
 * Realm surfaces are framed via HOST-INJECTED app renderers (`apps[].render`) — the package owns the
 * frame, the host owns the content. The launcher is DATA-DRIVEN from the `apps` prop (+ an
 * `autoSurfaced` tier for realm-derived pages), never a hardcoded list; the host derives it from its
 * RealmRegistry / nav. Theme-neutral: NO palette, fonts, or wordmark ship here — the Analog-Studio
 * ember look is host-supplied via className/style + CSS-vars, mirroring `/site` + `/account`. Origin:
 * `.scratch/beam-ux-uplift/OS-SHELL-NOTES.md`.
 */

export { Shell, type ShellProps } from './Shell.js';
export {
    useWindowManager,
    windowManagerReducer,
    initialWindowManagerState,
    visibleWindows,
    isTaskOpen,
    type WindowManager,
    type WindowManagerState,
    type WindowManagerAction,
    type ManagedWindow,
} from './windowManager.js';
export type { ShellApp, ShellAutoPage, ShellMenu, ShellThemeHooks } from './types.js';
