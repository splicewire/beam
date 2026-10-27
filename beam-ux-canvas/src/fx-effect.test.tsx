/**
 * `<FxEffect>`'s branches (landing-motion build/01, Scope items 3 and 8; receipt 2). The overlay is a
 * stub element with no WebGL. Each describe names its environment mock (`mockEnvironment`: the WebGL
 * probe and `prefers-reduced-motion` mocked at the browser seam), so `lite` and `full` are reachable.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetCapabilityForTests } from './capability';
import { FxBoundary } from './fx-boundary';
import { FxEffect, type FxPlacement } from './fx-effect';
import type { EffectTier, Surface } from './tiers';
import { mockEnvironment } from './test-support';

const CHILDREN_HTML = '<h1>Make a song</h1><a href="/studio">Start</a>';
const Children = () => (
    <>
        <h1>Make a song</h1>
        <a href="/studio">Start</a>
    </>
);
const Overlay = () => <i data-testid="overlay" />;

function renderEffect({
    mode = 'persuade',
    userTier,
    placement,
    kind,
    boundary = true,
}: {
    mode?: Surface;
    userTier?: EffectTier | null;
    placement?: FxPlacement;
    kind?: string;
    boundary?: boolean;
}) {
    const effect = (
        <FxEffect kind={kind} placement={placement} overlay={<Overlay />}>
            <Children />
        </FxEffect>
    );
    return render(
        boundary ? (
            <FxBoundary mode={mode} userTier={userTier}>
                {effect}
            </FxBoundary>
        ) : (
            effect
        ),
    );
}

afterEach(() => {
    cleanup();
    resetCapabilityForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('FxEffect — capable (WebGL true, reduced motion false)', () => {
    it('renders bare outside a boundary: the children byte-identical, no wrapper, no overlay', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const overlay = vi.fn(() => <Overlay />);
        const { container } = render(
            <FxEffect overlay={overlay}>
                <Children />
            </FxEffect>,
        );
        expect(container.innerHTML).toBe(CHILDREN_HTML);
        expect(overlay).not.toHaveBeenCalled();
    });

    it('off (userTier="off"): the children bare with no wrapper and no data-fx-tier', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container } = renderEffect({ userTier: 'off' });
        expect(container.innerHTML).toBe(CHILDREN_HTML);
        expect(container.querySelector('[data-fx-tier]')).toBeNull();
    });

    it.each(['lite', 'full'] as const)('%s: a wrapper with data-fx-tier and the overlay', (tier) => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container, getByTestId } = renderEffect({ userTier: tier });
        const wrapper = container.firstElementChild as HTMLElement;
        expect(wrapper.dataset.fxTier).toBe(tier);
        expect(wrapper.dataset.fxRenderer).toBe('webgl-overlay');
        expect(wrapper.style.position).toBe('relative');
        expect(wrapper.style.isolation).toBe('isolate');
        expect(getByTestId('overlay')).toBeTruthy();
    });

    it('placement="over" (the default): the children first, then the overlay layer on top', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container } = renderEffect({});
        const kids = [...(container.firstElementChild as HTMLElement).children].map((el) => el.tagName + (el.getAttribute('data-fx-overlay') ?? ''));
        expect(kids).toEqual(['H1', 'A', 'DIVover']);
        const layer = container.querySelector('[data-fx-overlay]') as HTMLElement;
        expect(layer.style.zIndex).toBe('');
        expect(layer.style.pointerEvents).toBe('none');
        expect(layer.getAttribute('aria-hidden')).toBe('true');
    });

    it('placement="under": the overlay layer first, composited beneath the children', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container } = renderEffect({ placement: 'under' });
        const kids = [...(container.firstElementChild as HTMLElement).children].map((el) => el.tagName + (el.getAttribute('data-fx-overlay') ?? ''));
        expect(kids).toEqual(['DIVunder', 'H1', 'A']);
        const layer = container.querySelector('[data-fx-overlay]') as HTMLElement;
        expect(layer.style.zIndex).toBe('-1');
        expect(layer.style.pointerEvents).toBe('none');
    });

    it('operate + userTier="off" (the editor clamp) mounts no overlay at a full capability', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container, queryByTestId } = renderEffect({ mode: 'operate', userTier: 'off' });
        expect(queryByTestId('overlay')).toBeNull();
        expect(container.innerHTML).toBe(CHILDREN_HTML);
    });

    it('operate clamps a user "full" to lite', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container } = renderEffect({ mode: 'operate', userTier: 'full' });
        expect((container.firstElementChild as HTMLElement).dataset.fxTier).toBe('lite');
    });

    it('kind="noop" renders bare at full', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { container } = renderEffect({ kind: 'noop' });
        expect(container.innerHTML).toBe(CHILDREN_HTML);
    });

    it('an overlay function receives the resolved context; a null overlay stays bare', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const seen: string[] = [];
        const { container } = render(
            <FxBoundary mode="persuade" userTier="lite">
                <FxEffect
                    overlay={(fx) => {
                        seen.push(fx.effectiveTier);
                        return null;
                    }}
                >
                    <Children />
                </FxEffect>
            </FxBoundary>,
        );
        expect(seen).toContain('lite');
        expect(container.innerHTML).toBe(CHILDREN_HTML);
    });
});

describe('FxEffect — reduced motion (WebGL true, reduced motion TRUE)', () => {
    it('every tier renders the same bare DOM twin: no wrapper, no data-fx-tier, no overlay', () => {
        mockEnvironment({ webgl: true, reducedMotion: true });
        const html = (['off', 'lite', 'full'] as const).map((userTier) => {
            const { container, unmount } = renderEffect({ userTier });
            const out = container.innerHTML;
            unmount();
            return out;
        });
        expect(html).toEqual([CHILDREN_HTML, CHILDREN_HTML, CHILDREN_HTML]);
    });
});

describe('FxEffect — no capability (WebGL FALSE, reduced motion false)', () => {
    it('renders bare at a full user tier', () => {
        mockEnvironment({ webgl: false, reducedMotion: false });
        const { container } = renderEffect({ userTier: 'full' });
        expect(container.innerHTML).toBe(CHILDREN_HTML);
    });
});

/**
 * A probe, not a rule (landing-motion amend 01, the Codex review's question; issue 04 composes
 * HeroPlayer on FxEffect). Scope item 3 renders the children bare with no wrapper at `off` and inside
 * a wrapper when the tier is on, so a LIVE on↔off change moves the children to a different parent:
 * React remounts them, resetting their state and dropping focus. lite↔full keeps the wrapper, and
 * with it the state and focus. A host that must keep a child's state across the visitor's toggle
 * holds that state above the `<FxEffect>`.
 */
describe('FxEffect — a live tier change (probe; WebGL true, reduced motion false)', () => {
    function Counter() {
        const [n, setN] = useState(0);
        return (
            <button type="button" onClick={() => setN(n + 1)}>
                count {n}
            </button>
        );
    }
    const at = (userTier: EffectTier) => (
        <FxBoundary mode="persuade" userTier={userTier}>
            <FxEffect overlay={<Overlay />}>
                <Counter />
            </FxEffect>
        </FxBoundary>
    );
    const press = () => {
        const button = screen.getByRole('button');
        fireEvent.click(button);
        act(() => button.focus());
        return button;
    };

    it('full → off → full remounts the children: their state resets and focus is lost', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { rerender } = render(at('full'));
        const before = press();
        expect(before.textContent).toBe('count 1');
        expect(document.activeElement).toBe(before);

        rerender(at('off'));
        const bare = screen.getByRole('button');
        expect(bare).not.toBe(before);
        expect(bare.textContent).toBe('count 0');
        expect(document.activeElement).not.toBe(bare);

        fireEvent.click(bare);
        rerender(at('full'));
        expect(screen.getByRole('button').textContent).toBe('count 0');
    });

    it('lite ↔ full keeps the wrapper: the same node, its state and its focus', () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const { rerender, container } = render(at('lite'));
        const before = press();
        rerender(at('full'));
        expect(container.querySelector('[data-fx-tier]')?.getAttribute('data-fx-tier')).toBe('full');
        expect(screen.getByRole('button')).toBe(before);
        expect(before.textContent).toBe('count 1');
        expect(document.activeElement).toBe(before);
    });
});
