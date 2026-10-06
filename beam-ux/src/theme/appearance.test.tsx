import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The ONE appearance contract (docs-walkthrough DM5, DOCS-13; hoisted from beam-inertia, lead ruling 3): the choice is
 * `light` | `dark` | `system` (default), stored in `localStorage['appearance']` and an `appearance` cookie, and applied
 * as `.dark` plus `color-scheme` on `<html>`. A system change re-renders subscribers, so a component keyed on the
 * RESOLVED appearance (the API reference) follows the OS without a reload.
 */
let systemDark = false;
let mqListeners: Array<() => void> = [];

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    systemDark = false;
    mqListeners = [];
    window.matchMedia = ((query: string) => ({
        get matches() { return query.includes('dark') && systemDark; },
        media: query,
        addEventListener: (_: string, cb: () => void) => mqListeners.push(cb),
        removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
});
afterEach(() => { mqListeners = []; });

const load = () => import('./appearance.js');

describe('appearance', () => {
    it('defaults to system and stores it', async () => {
        const { initializeTheme } = await load();
        initializeTheme();
        expect(localStorage.getItem('appearance')).toBe('system');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('applies and persists a choice', async () => {
        const { initializeTheme, useAppearance } = await load();
        initializeTheme();
        let api: ReturnType<typeof useAppearance> | null = null;
        function Probe() { api = useAppearance(); return null; }
        render(<Probe />);

        act(() => api!.updateAppearance('dark'));

        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.cookie).toContain('appearance=dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.style.colorScheme).toBe('dark');
        expect(api!.resolvedAppearance).toBe('dark');
    });

    it('re-renders subscribers when the system flips under "system"', async () => {
        const { initializeTheme, useAppearance } = await load();
        initializeTheme();
        const seen: string[] = [];
        function Probe() { seen.push(useAppearance().resolvedAppearance); return null; }
        render(<Probe />);

        systemDark = true;
        act(() => mqListeners.forEach((cb) => cb()));

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(seen.at(-1)).toBe('dark');
    });
});
