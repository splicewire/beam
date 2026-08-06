import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEffectiveCan, useShellMode } from './shellMode.js';

const STRIP = 'site.edit';

describe('createEffectiveCan', () => {
    it('is the base predicate when not previewing', () => {
        const base = (c: string) => c === STRIP || c === 'other';
        const can = createEffectiveCan(base, false, STRIP);
        expect(can(STRIP)).toBe(true);
        expect(can('other')).toBe(true);
        expect(can('nope')).toBe(false);
    });

    it('strips exactly the previewed capability while view-as-visitor is on', () => {
        const base = () => true;
        const can = createEffectiveCan(base, true, STRIP);
        expect(can(STRIP)).toBe(false);
        expect(can('other')).toBe(true);
    });

    it('is inert with no previewStripCapability (a host with no preview)', () => {
        const can = createEffectiveCan(() => true, true, undefined);
        expect(can(STRIP)).toBe(true);
    });
});

describe('useShellMode', () => {
    it('starts in desk mode (or the given initial) with an ungated can', () => {
        const { result } = renderHook(() =>
            useShellMode({ storeCan: (c) => c === STRIP, previewStripCapability: STRIP }),
        );
        expect(result.current.mode).toBe('desk');
        expect(result.current.effectiveCan(STRIP)).toBe(true);
        expect(result.current.viewAsVisitor).toBe(false);
    });

    it('enterWindow switches mode; the visitor preview down-gates only the stripped cap', () => {
        const { result } = renderHook(() =>
            useShellMode({ storeCan: () => true, previewStripCapability: STRIP }),
        );
        act(() => result.current.windowChrome.enterWindow());
        expect(result.current.mode).toBe('window');

        act(() => result.current.windowChrome.setViewAsVisitor(true));
        expect(result.current.effectiveCan(STRIP)).toBe(false);
        expect(result.current.effectiveCan('other')).toBe(true);
    });

    it('exitWindow clears the preview and returns to desk (desk never left down-gated)', () => {
        const { result } = renderHook(() =>
            useShellMode({ storeCan: () => true, previewStripCapability: STRIP }),
        );
        act(() => {
            result.current.windowChrome.enterWindow();
            result.current.windowChrome.setViewAsVisitor(true);
        });
        act(() => result.current.windowChrome.exitWindow());
        expect(result.current.mode).toBe('desk');
        expect(result.current.viewAsVisitor).toBe(false);
        expect(result.current.effectiveCan(STRIP)).toBe(true);
    });

    it('focusChrome tracks the active state and enters/exits focus', () => {
        const { result } = renderHook(() => useShellMode({ storeCan: () => true }));
        expect(result.current.focusChrome.active).toBe(false);
        act(() => result.current.focusChrome.enterFocus());
        expect(result.current.mode).toBe('focus');
        expect(result.current.focusChrome.active).toBe(true);
        act(() => result.current.focusChrome.exitFocus());
        expect(result.current.mode).toBe('desk');
    });
});
