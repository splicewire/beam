/**
 * The seam's first late-failure site with `three` itself as the rejected `import()` (landing-motion
 * build/01 Scope item 7; the Codex review's question, amend 01). Its own file: `three` is mocked here
 * to fail to load, so `loadThree()`'s real `import('three')` rejects, where `fx-canvas.test.tsx`
 * mocks `three` to load and rejects the scene chunk instead. jsdom; WebGL probe true and reduced
 * motion false at the browser seam (`mockEnvironment`).
 */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { canWebGl, resetCapabilityForTests } from './capability';
import { FxBoundary } from './fx-boundary';
import { FxCanvas, type FxScene } from './fx-canvas';
import { FxEffect } from './fx-effect';
import { mockEnvironment, renderers, resetThreeStub } from './test-support';

vi.mock('three', () => {
    throw new Error('Failed to fetch dynamically imported module: three');
});

beforeEach(() => {
    resetThreeStub();
    resetCapabilityForTests();
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it("a rejected import('three'): one warn naming the import site, 0 canvas, the probe pinned, every boundary off", async () => {
    const env = mockEnvironment({ webgl: true, reducedMotion: false, intersecting: false });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scene = vi.fn((): FxScene => ({ build: () => ({}) as never, frame: () => {} }));
    const { container } = render(
        <>
            <FxBoundary mode="persuade">
                <FxEffect placement="under" overlay={<FxCanvas scene={scene} />}>
                    <h1>one</h1>
                </FxEffect>
            </FxBoundary>
            <FxBoundary mode="persuade">
                <FxEffect placement="under" overlay={<FxCanvas scene={scene} />}>
                    <h2>two</h2>
                </FxEffect>
            </FxBoundary>
        </>,
    );
    expect(container.querySelectorAll('[data-fx-tier="full"]')).toHaveLength(2);

    await act(async () => env.intersect(true));
    await vi.waitFor(() => expect(container.innerHTML).toBe('<h1>one</h1><h2>two</h2>'));
    expect(warn).toHaveBeenCalledTimes(1);
    // vitest rewraps a throwing mock factory's error in its own message, so the site prefix is what is pinned.
    expect(String(warn.mock.calls[0][0])).toMatch(/^\[beam-ux-canvas\] effect disabled: import: /);
    expect(renderers).toHaveLength(0);
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
    expect(canWebGl()).toBe(false);
});
