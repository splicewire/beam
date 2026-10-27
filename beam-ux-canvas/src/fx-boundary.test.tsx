/**
 * `<FxBoundary>` takes the user tier as a prop — no store (landing-motion build/01, Scope items 2 and 8).
 * The first three cases are the prototype's `useEffectsStore.test.ts` (untouched → set → reset)
 * adapted to the prop/callback shape: the host holds the value, a descendant writes through
 * `useFx().setUserTier`, the boundary forwards it to `onUserTierChange`.
 *
 * Environment per case (`mockEnvironment`): the WebGL probe and `prefers-reduced-motion` are mocked
 * at the browser seam; the package's own capability module runs unmodified against them.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pinCapabilityOff, resetCapabilityForTests } from './capability';
import { FxBoundary, useFx } from './fx-boundary';
import type { EffectTier } from './tiers';
import { mockEnvironment } from './test-support';

function Probe({ id = 'probe' }: { id?: string }) {
    const fx = useFx();
    return (
        <output data-testid={id} data-tier={fx.effectiveTier} data-user={String(fx.userTier)} data-forced={String(fx.forcedOff)}>
            <button type="button" onClick={() => fx.setUserTier('lite')}>
                lite
            </button>
            <button type="button" onClick={() => fx.setUserTier('off')}>
                pause
            </button>
            <button type="button" onClick={() => fx.setUserTier(null)}>
                reset
            </button>
        </output>
    );
}

/** A host holding the preference in its own state — the shape audiostud's `useMotionPreference()` takes. */
function Host({ onChange }: { onChange?: (tier: EffectTier | null) => void }) {
    const [userTier, setUserTier] = useState<EffectTier | null>(null);
    return (
        <FxBoundary
            mode="persuade"
            userTier={userTier}
            onUserTierChange={(tier) => {
                onChange?.(tier);
                setUserTier(tier);
            }}
        >
            <Probe />
        </FxBoundary>
    );
}

const probe = (id = 'probe') => screen.getByTestId(id);

afterEach(() => {
    cleanup();
    resetCapabilityForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('FxBoundary — the user tier as a prop (capable: WebGL true, reduced motion false)', () => {
    it('starts untouched (null → the surface default)', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        render(<Host />);
        expect(probe().dataset.user).toBe('null');
        expect(probe().dataset.tier).toBe('full');
    });

    it('a descendant sets the tier through setUserTier → onUserTierChange round trip', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const onChange = vi.fn();
        render(<Host onChange={onChange} />);
        act(() => screen.getByText('lite').click());
        expect(onChange).toHaveBeenCalledExactlyOnceWith('lite');
        expect(probe().dataset.user).toBe('lite');
        expect(probe().dataset.tier).toBe('lite');

        act(() => screen.getByText('pause').click());
        expect(onChange).toHaveBeenLastCalledWith('off');
        expect(probe().dataset.tier).toBe('off');
        expect(probe().dataset.forced).toBe('false');
    });

    it('resets back to untouched', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        render(<Host />);
        act(() => screen.getByText('pause').click());
        expect(probe().dataset.tier).toBe('off');
        act(() => screen.getByText('reset').click());
        expect(probe().dataset.user).toBe('null');
        expect(probe().dataset.tier).toBe('full');
    });

    it('is controlled: without onUserTierChange, setUserTier changes nothing (the package holds no state)', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        render(
            <FxBoundary mode="persuade">
                <Probe />
            </FxBoundary>,
        );
        act(() => screen.getByText('pause').click());
        expect(probe().dataset.tier).toBe('full');
    });

    it('renders only a context provider — no wrapper element', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container } = render(
            <FxBoundary mode="persuade">
                <p>real copy</p>
            </FxBoundary>,
        );
        expect(container.innerHTML).toBe('<p>real copy</p>');
    });

    it('useFx throws outside a boundary', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow(/within an <FxBoundary>/);
    });
});

describe('FxBoundary — kill switches', () => {
    it('reduced motion (WebGL true, reduced motion TRUE): off and forcedOff', () => {
        mockEnvironment({ webgl: true, reducedMotion: true });
        render(
            <FxBoundary mode="persuade" userTier="full">
                <Probe />
            </FxBoundary>,
        );
        expect(probe().dataset.tier).toBe('off');
        expect(probe().dataset.forced).toBe('true');
    });

    it('no capability (WebGL FALSE, reduced motion false): off and forcedOff', () => {
        mockEnvironment({ webgl: false, reducedMotion: false });
        render(
            <FxBoundary mode="persuade">
                <Probe />
            </FxBoundary>,
        );
        expect(probe().dataset.tier).toBe('off');
        expect(probe().dataset.forced).toBe('true');
    });

    it('the late-failure pin (WebGL true until pinned): one warn, every mounted boundary drops to off', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <>
                <FxBoundary mode="persuade">
                    <Probe id="a" />
                </FxBoundary>
                <FxBoundary mode="persuade">
                    <Probe id="b" />
                </FxBoundary>
            </>,
        );
        expect(probe('a').dataset.tier).toBe('full');
        expect(probe('b').dataset.tier).toBe('full');

        act(() => pinCapabilityOff('renderer', new Error('boom')));
        act(() => pinCapabilityOff('context-lost', new Error('again')));

        expect(probe('a').dataset.tier).toBe('off');
        expect(probe('b').dataset.tier).toBe('off');
        expect(probe('b').dataset.forced).toBe('true');
        expect(warn).toHaveBeenCalledExactlyOnceWith('[beam-ux-canvas] effect disabled: renderer: boom');
    });
});
