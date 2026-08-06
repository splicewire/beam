import { describe, expect, it } from 'vitest';
import {
    initialWindowManagerState,
    windowManagerReducer,
    visibleWindows,
    isTaskOpen,
    type WindowManagerState,
} from './windowManager.js';

const reduce = (state: WindowManagerState, ...actions: Parameters<typeof windowManagerReducer>[1][]) =>
    actions.reduce((s, a) => windowManagerReducer(s, a), state);

describe('windowManagerReducer', () => {
    it('opens a window, focuses it, and marks the task open', () => {
        const s = reduce(initialWindowManagerState, { type: 'open', key: 'site' });
        expect(s.focused).toBe('site');
        expect(isTaskOpen(s, 'site')).toBe(true);
        expect(s.windows.site.minimized).toBe(false);
        expect(visibleWindows(s).map((w) => w.key)).toEqual(['site']);
    });

    it('opening a second window focuses it and raises it above the first', () => {
        const s = reduce(
            initialWindowManagerState,
            { type: 'open', key: 'site' },
            { type: 'open', key: 'account' },
        );
        expect(s.focused).toBe('account');
        expect(s.windows.account.z).toBeGreaterThan(s.windows.site.z);
        // z-sorted back-to-front: site behind, account front.
        expect(visibleWindows(s).map((w) => w.key)).toEqual(['site', 'account']);
    });

    it('focus raises an existing window to the front', () => {
        const s = reduce(
            initialWindowManagerState,
            { type: 'open', key: 'site' },
            { type: 'open', key: 'account' },
            { type: 'focus', key: 'site' },
        );
        expect(s.focused).toBe('site');
        expect(s.windows.site.z).toBeGreaterThan(s.windows.account.z);
    });

    it('minimize hides the window but keeps the task; focus falls to the next visible', () => {
        const s = reduce(
            initialWindowManagerState,
            { type: 'open', key: 'site' },
            { type: 'open', key: 'account' },
            { type: 'minimize', key: 'account' },
        );
        expect(s.windows.account.minimized).toBe(true);
        expect(isTaskOpen(s, 'account')).toBe(true);
        expect(visibleWindows(s).map((w) => w.key)).toEqual(['site']);
        expect(s.focused).toBe('site');
    });

    it('opening a minimized window un-minimizes and re-focuses it', () => {
        const s = reduce(
            initialWindowManagerState,
            { type: 'open', key: 'site' },
            { type: 'minimize', key: 'site' },
            { type: 'open', key: 'site' },
        );
        expect(s.windows.site.minimized).toBe(false);
        expect(s.focused).toBe('site');
    });

    it('minimizing the last visible window leaves focus null', () => {
        const s = reduce(
            initialWindowManagerState,
            { type: 'open', key: 'site' },
            { type: 'minimize', key: 'site' },
        );
        expect(s.focused).toBeNull();
        expect(visibleWindows(s)).toEqual([]);
    });

    it('close removes the window entirely and re-picks focus', () => {
        const s = reduce(
            initialWindowManagerState,
            { type: 'open', key: 'site' },
            { type: 'open', key: 'account' },
            { type: 'close', key: 'account' },
        );
        expect(isTaskOpen(s, 'account')).toBe(false);
        expect(s.focused).toBe('site');
        const s2 = windowManagerReducer(s, { type: 'close', key: 'site' });
        expect(s2.focused).toBeNull();
        expect(visibleWindows(s2)).toEqual([]);
    });

    it('is a no-op for minimize/close on an unknown key', () => {
        const s = reduce(initialWindowManagerState, { type: 'open', key: 'site' });
        expect(windowManagerReducer(s, { type: 'minimize', key: 'ghost' })).toBe(s);
        expect(windowManagerReducer(s, { type: 'close', key: 'ghost' })).toBe(s);
    });
});
