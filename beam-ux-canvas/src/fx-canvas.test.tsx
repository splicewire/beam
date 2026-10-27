/**
 * The lifecycle seam (`FxCanvas`) — landing-motion build/01 Scope items 6 and 7. jsdom; every case
 * mocks its environment (`mockEnvironment`: WebGL probe + reduced motion at the browser seam,
 * IntersectionObserver / ResizeObserver / rAF driven by hand) and `three`'s renderer is a stub, so
 * nothing here draws: the cases pin the loop, the observers, the DPR cap, disposal and the
 * late-failure pin. Live tiers in a browser are the harness's.
 */
import { act, cleanup, render } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCapabilityForTests } from './capability';
import { FxBoundary } from './fx-boundary';
import { FxCanvas, type FxFrameInputs, type FxScene, type FxSceneContext } from './fx-canvas';
import { FxEffect } from './fx-effect';
import type { ThreeModule } from './load-three';
import type { EffectTier } from './tiers';
import { mockEnvironment, rendererFailure, renderers, resetThreeStub, settle } from './test-support';

vi.mock('three', async () => (await import('./test-support')).threeModuleStub());

interface Probe {
    scene: FxScene;
    built: FxSceneContext[];
    frames: { t: number; dt: number; inputs: FxFrameInputs }[];
    disposables: { geometry: { dispose: ReturnType<typeof vi.fn> }; material: { dispose: ReturnType<typeof vi.fn> }; texture: { dispose: ReturnType<typeof vi.fn> } };
    park: boolean;
}

/** A scene double: adds one mesh-like object (geometry + material + texture) and records calls. */
function probeScene(): Probe {
    const probe: Probe = {
        built: [],
        frames: [],
        park: false,
        disposables: { geometry: { dispose: vi.fn() }, material: { dispose: vi.fn() }, texture: { dispose: vi.fn() } },
        scene: {
            build(three: ThreeModule, ctx: FxSceneContext) {
                probe.built.push(ctx);
                const object = new three.Object3D() as unknown as Record<string, unknown>;
                object.geometry = probe.disposables.geometry;
                object.material = { ...probe.disposables.material, map: { isTexture: true, dispose: probe.disposables.texture.dispose } };
                (object.material as { dispose: unknown }).dispose = probe.disposables.material.dispose;
                ctx.scene.add(object as never);
                return new three.OrthographicCamera() as never;
            },
            frame(t, dt, inputs) {
                probe.frames.push({ t, dt, inputs: { ...inputs, pointer: { ...inputs.pointer } } });
                return probe.park ? false : undefined;
            },
        },
    };
    return probe;
}

function Stage({ probe, tier, paused, playing }: { probe: Probe; tier?: EffectTier | null; paused?: boolean; playing?: boolean }) {
    const scene = useCallback(() => probe.scene, [probe]);
    const canvas = <FxCanvas scene={scene} paused={paused} playing={playing} />;
    return tier === undefined ? (
        canvas
    ) : (
        <FxBoundary mode="persuade" userTier={tier}>
            {canvas}
        </FxBoundary>
    );
}

const canvases = () => document.querySelectorAll('canvas');

beforeEach(() => {
    resetThreeStub();
    resetCapabilityForTests();
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('FxCanvas — mount (WebGL true, reduced motion false)', () => {
    it('is lazy: nothing requested until the element approaches (rootMargin 25 %), then one renderer and one canvas', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false, intersecting: false });
        const probe = probeScene();
        const factory = vi.fn(() => probe.scene);
        function Lazy() {
            const scene = useCallback(factory, []);
            return <FxCanvas scene={scene} />;
        }
        render(<Lazy />);
        await settle();
        expect(factory).not.toHaveBeenCalled();
        expect(renderers).toHaveLength(0);
        expect(env.observerOptions).toEqual(expect.arrayContaining([{ rootMargin: '25%' }, { threshold: 0.01 }]));

        await act(async () => env.intersect(true));
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        expect(factory).toHaveBeenCalledTimes(1);
        expect(renderers).toHaveLength(1);
        expect(canvases()).toHaveLength(1);
    });

    it.each([
        ['full', 2],
        ['lite', 1.5],
    ] as const)('caps the DPR at %s → %s (devicePixelRatio 3)', async (tier, cap) => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        vi.stubGlobal('devicePixelRatio', 3);
        const probe = probeScene();
        render(<Stage probe={probe} tier={tier} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        expect(probe.built[0].dpr).toBe(cap);
        expect(probe.built[0].tier).toBe(tier);
        expect(renderers[0].setPixelRatio).toHaveBeenCalledWith(cap);
    });

    it('mounts nothing at off (a boundary with userTier="off")', async () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        const { container } = render(<Stage probe={probe} tier="off" />);
        await settle(5);
        expect(renderers).toHaveLength(0);
        expect(container.querySelector('div[aria-hidden="true"]')).not.toBeNull();
    });

    it('mounts nothing under reduced motion, even standalone (WebGL true, reduced motion TRUE)', async () => {
        mockEnvironment({ webgl: true, reducedMotion: true });
        const probe = probeScene();
        render(<Stage probe={probe} />);
        await settle(5);
        expect(renderers).toHaveLength(0);
        expect(canvases()).toHaveLength(0);
    });
});

describe('FxCanvas — the loop (WebGL true, reduced motion false)', () => {
    it('runs frame() then renders, measures fx:tick, and forwards inputs.playing', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const measure = vi.spyOn(performance, 'measure');
        const probe = probeScene();
        render(<Stage probe={probe} playing />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        const rendersBefore = renderers[0].render.mock.calls.length;

        env.flushFrames(3);
        expect(probe.frames).toHaveLength(3);
        expect(probe.frames[0].dt).toBe(0);
        expect(probe.frames[2].inputs.playing).toBe(true);
        expect(renderers[0].render.mock.calls.length - rendersBefore).toBe(3);
        expect(measure.mock.calls.filter(([name]) => name === 'fx:tick')).toHaveLength(3);
    });

    it('pauses when the element leaves the viewport and resumes when it returns', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        render(<Stage probe={probe} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(1);
        expect(probe.frames).toHaveLength(1);

        act(() => env.intersect(false));
        expect(env.pendingFrames()).toBe(0);
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(1);

        act(() => env.intersect(true));
        env.flushFrames(2);
        expect(probe.frames).toHaveLength(3);
    });

    it('pauses on visibilitychange → hidden', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        render(<Stage probe={probe} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        act(() => void document.dispatchEvent(new Event('visibilitychange')));
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(0);

        visibility.mockReturnValue('visible');
        act(() => void document.dispatchEvent(new Event('visibilitychange')));
        env.flushFrames(1);
        expect(probe.frames).toHaveLength(1);
    });

    it('pauses while paused and resumes when unpaused', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        const { rerender } = render(<Stage probe={probe} paused />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(0);
        rerender(<Stage probe={probe} paused={false} />);
        env.flushFrames(2);
        expect(probe.frames).toHaveLength(2);
    });

    it('parks when frame() returns false, and requestFrame() wakes it', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        probe.park = true;
        render(<Stage probe={probe} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(1);
        expect(env.pendingFrames()).toBe(0);

        probe.built[0].requestFrame();
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(2);
    });

    it('hands the scene fresh size and exclusion rects on resize, and wakes a parked loop', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
        const probe = probeScene();
        probe.park = true;
        const copy = document.createElement('p');
        document.body.appendChild(copy);
        vi.spyOn(copy, 'getBoundingClientRect').mockReturnValue({ left: 40, top: 30, width: 100, height: 50 } as DOMRect);
        function WithExclusions() {
            const scene = useCallback(() => probe.scene, []);
            return <FxCanvas scene={scene} exclusions={() => [copy]} />;
        }
        render(<WithExclusions />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        const ctx = probe.built[0];
        expect([ctx.width, ctx.height]).toEqual([320, 200]);
        expect(ctx.exclusions).toEqual([{ x: 40, y: 30, width: 100, height: 50 }]);
        env.flushFrames(1);
        expect(probe.frames).toHaveLength(1);

        width.mockReturnValue(480);
        const observed = env.resize();
        expect(observed).toContain(copy);
        expect(ctx.width).toBe(480);
        expect(renderers[0].setSize).toHaveBeenLastCalledWith(480, 200, false);
        env.flushFrames(1);
        expect(probe.frames).toHaveLength(2);
        copy.remove();
    });
});

describe('FxCanvas — unmount (WebGL true, reduced motion false)', () => {
    it('disposes geometry, material, texture and renderer, force-loses the context once and removes the canvas', async () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        const { unmount } = render(<Stage probe={probe} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        const [renderer] = renderers;
        expect(canvases()).toHaveLength(1);

        unmount();
        expect(probe.disposables.geometry.dispose).toHaveBeenCalledTimes(1);
        expect(probe.disposables.material.dispose).toHaveBeenCalledTimes(1);
        expect(probe.disposables.texture.dispose).toHaveBeenCalledTimes(1);
        expect(renderer.dispose).toHaveBeenCalledTimes(1);
        expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
        expect(canvases()).toHaveLength(0);
    });
});

/** Two boundaries on one page, each an FxEffect with an FxCanvas overlay over real copy. */
function TwoEffects({ first, second }: { first: () => FxScene | Promise<FxScene>; second: () => FxScene | Promise<FxScene> }) {
    return (
        <>
            <FxBoundary mode="persuade">
                <FxEffect placement="under" overlay={<FxCanvas scene={first} />}>
                    <h1>one</h1>
                </FxEffect>
            </FxBoundary>
            <FxBoundary mode="persuade">
                <FxEffect placement="under" overlay={<FxCanvas scene={second} />}>
                    <h2>two</h2>
                </FxEffect>
            </FxBoundary>
        </>
    );
}

describe('FxCanvas — late WebGL failure pins the capability off (WebGL true until it fails, reduced motion false)', () => {
    const silenceWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
    const BARE = '<h1>one</h1><h2>two</h2>';

    it('a throwing renderer constructor: one warn, 0 canvas, and the second boundary also off', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false, intersecting: false });
        const warn = silenceWarn();
        const a = probeScene();
        const b = probeScene();
        const { container } = render(<TwoEffects first={() => a.scene} second={() => b.scene} />);
        expect(container.querySelectorAll('[data-fx-tier="full"]')).toHaveLength(2);

        rendererFailure.next = new Error('Error creating WebGL context.');
        await act(async () => env.intersect(true));
        await vi.waitFor(() => expect(container.innerHTML).toBe(BARE));
        expect(warn).toHaveBeenCalledExactlyOnceWith('[beam-ux-canvas] effect disabled: renderer: Error creating WebGL context.');
        expect(canvases()).toHaveLength(0);
        expect(container.querySelector('[data-fx-tier]')).toBeNull();
        expect(a.built).toHaveLength(0);
    });

    it('a rejected import() (the scene chunk): one warn, 0 canvas, every boundary off', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false, intersecting: false });
        const warn = silenceWarn();
        const b = probeScene();
        const { container } = render(
            <TwoEffects first={() => Promise.reject(new Error('Failed to fetch dynamically imported module'))} second={() => b.scene} />,
        );
        await act(async () => env.intersect(true));
        await vi.waitFor(() => expect(container.innerHTML).toBe(BARE));
        expect(warn).toHaveBeenCalledExactlyOnceWith(
            '[beam-ux-canvas] effect disabled: import: Failed to fetch dynamically imported module',
        );
        expect(canvases()).toHaveLength(0);
    });

    it('webglcontextlost with no restore within one frame: canvas unmounted, one warn, no further fx:tick, both boundaries off', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const warn = silenceWarn();
        const measure = vi.spyOn(performance, 'measure');
        const a = probeScene();
        const b = probeScene();
        const { container } = render(<TwoEffects first={() => a.scene} second={() => b.scene} />);
        await vi.waitFor(() => expect(a.built.length + b.built.length).toBe(2));
        env.flushFrames(1);
        const [first, second] = renderers;

        act(() => void first.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
        expect(warn).not.toHaveBeenCalled();
        act(() => env.flushFrames(1));
        await vi.waitFor(() => expect(container.innerHTML).toBe(BARE));

        expect(warn).toHaveBeenCalledExactlyOnceWith(
            '[beam-ux-canvas] effect disabled: context-lost: webglcontextlost with no webglcontextrestored within one frame',
        );
        expect(canvases()).toHaveLength(0);
        expect(first.dispose).toHaveBeenCalledTimes(1);
        expect(second.dispose).toHaveBeenCalledTimes(1);
        const ticks = measure.mock.calls.filter(([name]) => name === 'fx:tick').length;
        env.flushFrames(5);
        expect(measure.mock.calls.filter(([name]) => name === 'fx:tick').length).toBe(ticks);
    });

    it('a context restored within the frame is not a failure', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const warn = silenceWarn();
        const a = probeScene();
        render(<Stage probe={a} />);
        await vi.waitFor(() => expect(a.built).toHaveLength(1));
        const canvas = renderers[0].domElement;
        act(() => void canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
        act(() => void canvas.dispatchEvent(new Event('webglcontextrestored')));
        env.flushFrames(2);
        expect(warn).not.toHaveBeenCalled();
        expect(canvases()).toHaveLength(1);
        expect(a.frames.length).toBeGreaterThan(0);
    });
});

describe('FxCanvas — a playing transition wakes a parked scene (WebGL true, reduced motion false)', () => {
    it('parks while idle; flipping playing with no pointer or resize activity runs one frame that sees the new input', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        probe.park = true;
        const { rerender } = render(<Stage probe={probe} playing={false} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(1);
        expect(probe.frames[0].inputs.playing).toBe(false);
        expect(env.pendingFrames()).toBe(0);

        rerender(<Stage probe={probe} playing />);
        expect(env.pendingFrames()).toBe(1);
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(2);
        expect(probe.frames[1].inputs.playing).toBe(true);

        rerender(<Stage probe={probe} playing={false} />);
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(3);
        expect(probe.frames[2].inputs.playing).toBe(false);
    });

    it('keeps the guards: no frame while offscreen, hidden or paused; the offscreen one runs on return', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        probe.park = true;
        const { rerender } = render(<Stage probe={probe} playing={false} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(1);
        expect(probe.frames).toHaveLength(1);

        // Paused: the flip queues nothing.
        rerender(<Stage probe={probe} playing paused />);
        expect(env.pendingFrames()).toBe(0);
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(1);

        // Hidden: nothing either.
        rerender(<Stage probe={probe} playing={false} />);
        env.flushFrames(1);
        const afterUnpause = probe.frames.length;
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        act(() => void document.dispatchEvent(new Event('visibilitychange')));
        rerender(<Stage probe={probe} playing />);
        expect(env.pendingFrames()).toBe(0);
        visibility.mockReturnValue('visible');
        act(() => void document.dispatchEvent(new Event('visibilitychange')));
        env.flushFrames(1);
        expect(probe.frames.at(-1)!.inputs.playing).toBe(true);

        // Offscreen: the flip queues nothing until the element returns.
        act(() => env.intersect(false));
        const before = probe.frames.length;
        rerender(<Stage probe={probe} playing={false} />);
        expect(env.pendingFrames()).toBe(0);
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(before);
        act(() => env.intersect(true));
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(before + 1);
        expect(probe.frames.at(-1)!.inputs.playing).toBe(false);
        expect(afterUnpause).toBeGreaterThan(1);
    });
});

/** A scene whose build waits on the case: it adds `early` at once and `late` only when released. */
function deferredScene() {
    const mk = () => ({ geometry: { dispose: vi.fn() }, material: { dispose: vi.fn() } });
    const early = mk();
    const late = mk();
    let release!: (outcome: 'resolve' | 'reject') => void;
    const gate = new Promise<'resolve' | 'reject'>((r) => (release = r));
    const frames: number[] = [];
    const scene: FxScene = {
        async build(three: ThreeModule, ctx: FxSceneContext) {
            const add = (r: ReturnType<typeof mk>) => {
                const o = new three.Object3D() as unknown as Record<string, unknown>;
                Object.assign(o, r);
                ctx.scene.add(o as never);
            };
            add(early);
            const outcome = await gate;
            add(late);
            if (outcome === 'reject') throw new Error('scene build failed late');
            return new three.OrthographicCamera() as never;
        },
        frame(t) {
            frames.push(t);
        },
    };
    const calls = (r: ReturnType<typeof mk>) => [r.geometry.dispose.mock.calls.length, r.material.dispose.mock.calls.length];
    return { scene, early, late, release, frames, calls };
}

function DeferredStage({ scene }: { scene: FxScene }) {
    const factory = useCallback(() => scene, [scene]);
    return <FxCanvas scene={factory} />;
}

describe('FxCanvas — teardown is idempotent (WebGL true until it fails, reduced motion false)', () => {
    it('a late failure followed by unmount disposes geometry, material, texture and renderer exactly once', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const probe = probeScene();
        const { unmount } = render(<Stage probe={probe} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(1);
        const [renderer] = renderers;

        act(() => void renderer.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
        act(() => env.flushFrames(1));
        await vi.waitFor(() => expect(canvases()).toHaveLength(0));
        const counts = () => [
            probe.disposables.geometry.dispose.mock.calls.length,
            probe.disposables.material.dispose.mock.calls.length,
            probe.disposables.texture.dispose.mock.calls.length,
            renderer.dispose.mock.calls.length,
            renderer.forceContextLoss.mock.calls.length,
        ];
        expect(counts()).toEqual([1, 1, 1, 1, 1]);

        unmount();
        expect(counts()).toEqual([1, 1, 1, 1, 1]);
    });

    it('a build that resolves after unmount: no render, no frame, and what it added late is disposed once', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const d = deferredScene();
        const { unmount } = render(<DeferredStage scene={d.scene} />);
        await vi.waitFor(() => expect(renderers).toHaveLength(1));
        const [renderer] = renderers;
        unmount();
        expect(d.calls(d.early)).toEqual([1, 1]);
        expect(renderer.dispose).toHaveBeenCalledTimes(1);

        await act(async () => d.release('resolve'));
        await settle();
        expect(d.calls(d.early)).toEqual([1, 1]);
        expect(d.calls(d.late)).toEqual([1, 1]);
        expect(renderer.render).not.toHaveBeenCalled();
        env.flushFrames(3);
        expect(d.frames).toHaveLength(0);
    });

    it('a build that rejects after unmount: no warning, and what it added late is disposed once', async () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const d = deferredScene();
        const { unmount } = render(<DeferredStage scene={d.scene} />);
        await vi.waitFor(() => expect(renderers).toHaveLength(1));
        unmount();
        await act(async () => d.release('reject'));
        await settle();
        expect(d.calls(d.early)).toEqual([1, 1]);
        expect(d.calls(d.late)).toEqual([1, 1]);
        expect(warn).not.toHaveBeenCalled();
    });

    it('a build that resolves after a late failure: one warn, the pin, no render on the lost renderer, late resources disposed once', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const d = deferredScene();
        render(<DeferredStage scene={d.scene} />);
        await vi.waitFor(() => expect(renderers).toHaveLength(1));
        const [renderer] = renderers;
        act(() => void renderer.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
        act(() => env.flushFrames(1));
        await vi.waitFor(() => expect(canvases()).toHaveLength(0));
        expect(warn).toHaveBeenCalledExactlyOnceWith(
            '[beam-ux-canvas] effect disabled: context-lost: webglcontextlost with no webglcontextrestored within one frame',
        );

        await act(async () => d.release('resolve'));
        await settle();
        expect(d.calls(d.early)).toEqual([1, 1]);
        expect(d.calls(d.late)).toEqual([1, 1]);
        expect(renderer.render).not.toHaveBeenCalled();
        expect(renderer.dispose).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledTimes(1);
    });
});

describe('FxCanvas — a live prefers-reduced-motion change (WebGL true; reduced motion false, then true)', () => {
    it('tears the mounted canvas down once, runs no further frame, and the boundary goes bare; clearing it remounts', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        const scene = () => probe.scene;
        const { container } = render(
            <FxBoundary mode="persuade">
                <FxEffect placement="under" overlay={<FxCanvas scene={scene} />}>
                    <h1>one</h1>
                </FxEffect>
            </FxBoundary>,
        );
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(1);
        const [renderer] = renderers;
        expect(canvases()).toHaveLength(1);

        act(() => env.setReducedMotion(true));
        expect(canvases()).toHaveLength(0);
        expect(container.innerHTML).toBe('<h1>one</h1>');
        expect(renderer.dispose).toHaveBeenCalledTimes(1);
        expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
        expect(probe.disposables.geometry.dispose).toHaveBeenCalledTimes(1);
        const frames = probe.frames.length;
        env.flushFrames(3);
        expect(probe.frames).toHaveLength(frames);

        act(() => env.setReducedMotion(false));
        await vi.waitFor(() => expect(probe.built).toHaveLength(2));
        expect(renderers).toHaveLength(2);
        expect(canvases()).toHaveLength(1);
    });

    it('standalone (no boundary): the same teardown', async () => {
        const env = mockEnvironment({ webgl: true, reducedMotion: false });
        const probe = probeScene();
        render(<Stage probe={probe} />);
        await vi.waitFor(() => expect(probe.built).toHaveLength(1));
        env.flushFrames(1);
        act(() => env.setReducedMotion(true));
        expect(canvases()).toHaveLength(0);
        expect(renderers[0].dispose).toHaveBeenCalledTimes(1);
    });
});
