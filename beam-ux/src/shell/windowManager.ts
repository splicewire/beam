/**
 * The window-manager state core (beam-ux-uplift ticket 11).
 *
 * A small, pure reducer + a `useWindowManager` hook wrapping it. Deliberately free of React chrome
 * so the open/focus/minimize/close logic is unit-testable in isolation (the ticket's verification
 * bar). A "window" here is just a key + its lifecycle state; the shell binds keys to `ShellApp`s and
 * frames each open window. Z-order is a monotonically-rising counter — the highest is focused.
 */

import { useCallback, useReducer } from 'react';

/** One managed window — a key plus its lifecycle flags and stacking order. */
export type ManagedWindow = {
    /** The app/page key this window frames. */
    key: string;
    /** Minimized windows stay in the manager (dock task lit) but are not rendered on the desktop. */
    minimized: boolean;
    /** Z-order rank — higher is nearer the front. The max rank is the focused window. */
    z: number;
};

export type WindowManagerState = {
    /** Open windows, keyed by app key. Insertion order is stable; z drives paint order. */
    windows: Record<string, ManagedWindow>;
    /** The focused window key, or null when nothing is focused (all closed/minimized). */
    focused: string | null;
    /** The next z-rank to hand out. Monotonic. */
    nextZ: number;
};

export type WindowManagerAction =
    | { type: 'open'; key: string }
    | { type: 'focus'; key: string }
    | { type: 'minimize'; key: string }
    | { type: 'close'; key: string };

export const initialWindowManagerState: WindowManagerState = {
    windows: {},
    focused: null,
    nextZ: 1,
};

/** The focused window = the non-minimized window with the highest z, or null if none. */
function highestVisible(windows: Record<string, ManagedWindow>): string | null {
    let best: ManagedWindow | null = null;
    for (const w of Object.values(windows)) {
        if (w.minimized) continue;
        if (!best || w.z > best.z) best = w;
    }
    return best?.key ?? null;
}

export function windowManagerReducer(
    state: WindowManagerState,
    action: WindowManagerAction,
): WindowManagerState {
    switch (action.type) {
        case 'open':
        case 'focus': {
            // Open is idempotent: opening an already-open (or minimized) window just focuses it and
            // un-minimizes. Both actions raise the window to the front.
            const existing = state.windows[action.key];
            const z = state.nextZ;
            const win: ManagedWindow = { key: action.key, minimized: false, z };
            const windows = { ...state.windows, [action.key]: existing ? { ...existing, minimized: false, z } : win };
            return { windows, focused: action.key, nextZ: z + 1 };
        }
        case 'minimize': {
            const existing = state.windows[action.key];
            if (!existing) return state;
            const windows = { ...state.windows, [action.key]: { ...existing, minimized: true } };
            return { ...state, windows, focused: highestVisible(windows) };
        }
        case 'close': {
            if (!state.windows[action.key]) return state;
            const windows = { ...state.windows };
            delete windows[action.key];
            return { ...state, windows, focused: highestVisible(windows) };
        }
        default:
            return state;
    }
}

/** The ordered list of open (non-minimized) windows, back-to-front (ascending z). */
export function visibleWindows(state: WindowManagerState): ManagedWindow[] {
    return Object.values(state.windows)
        .filter((w) => !w.minimized)
        .sort((a, b) => a.z - b.z);
}

/** True when a window for `key` exists in the manager (open or minimized). */
export function isTaskOpen(state: WindowManagerState, key: string): boolean {
    return key in state.windows;
}

export type WindowManager = {
    state: WindowManagerState;
    open: (key: string) => void;
    focus: (key: string) => void;
    minimize: (key: string) => void;
    close: (key: string) => void;
};

/** React binding over {@link windowManagerReducer}. Stable callbacks; the shell drives the chrome. */
export function useWindowManager(initial: WindowManagerState = initialWindowManagerState): WindowManager {
    const [state, dispatch] = useReducer(windowManagerReducer, initial);
    const open = useCallback((key: string) => dispatch({ type: 'open', key }), []);
    const focus = useCallback((key: string) => dispatch({ type: 'focus', key }), []);
    const minimize = useCallback((key: string) => dispatch({ type: 'minimize', key }), []);
    const close = useCallback((key: string) => dispatch({ type: 'close', key }), []);
    return { state, open, focus, minimize, close };
}
