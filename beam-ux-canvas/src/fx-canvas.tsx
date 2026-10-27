/**
 * `<FxCanvas>` — the ONE lifecycle seam every WebGL scene mounts through (landing-motion ticket 06
 * Q20 and point 4; ticket 07 Q9/Q14). A scene implements `build(three, ctx)` and `frame(t, dt, inputs)`
 * and nothing else; the seam owns everything around them:
 *
 *   • the `requestAnimationFrame` loop, paused when the element leaves the viewport
 *     (IntersectionObserver, threshold 0.01), on `visibilitychange` → hidden, while `paused`, and
 *     whenever the tier resolves `off` (then nothing is mounted at all);
 *   • a lazy mount: `scene()` (typically `() => import('./my-scene').then(…)`) and `three` are first
 *     requested when the element comes within `rootMargin` (default 25 %) of the viewport;
 *   • a DPR cap per tier: ≤ 2 at `full`, ≤ 1.5 at `lite`;
 *   • `ctx.requestFrame()` to wake a parked loop (a `frame()` that returns `false` parks it — the
 *     `lite` idle story); a pointer within `pointerMargin` of the element, or a change of the
 *     `playing` prop, also wakes it (still subject to the viewport, visibility and pause guards);
 *   • `performance.measure('fx:tick')` around each tick (frame() + render);
 *   • a ResizeObserver that hands the scene fresh size and exclusion rects (`ctx.width`,
 *     `ctx.height`, `ctx.exclusions`) and wakes one frame;
 *   • on unmount: dispose every geometry, material and texture in `ctx.scene`, dispose the renderer,
 *     `forceContextLoss()`, and remove the canvas — each resource at most once, including after a
 *     late failure and for anything a build still in flight adds after the teardown;
 *   • late WebGL failure (ticket 06 Q30): a rejected `import()` (three or the scene chunk), a throwing
 *     renderer constructor, or `webglcontextlost` with no `webglcontextrestored` within one frame →
 *     the canvas is unmounted, one `console.warn` (`[beam-ux-canvas] effect disabled: <site>: …`),
 *     and the capability is pinned `off` for the page lifetime so every boundary resolves `off`.
 *
 * Tier: inside an `<FxBoundary>` the boundary's resolved tier; outside one `full`. Either way the
 * seam self-gates on the WebGL probe and `prefers-reduced-motion`, so a standalone consumer (www's
 * `ParticleObject`) still mounts nothing under reduced motion or without WebGL. The element it
 * renders is an inert, `aria-hidden` div — decoration only; the real DOM lives beside it.
 */
import { useContext, useEffect, useRef, type CSSProperties } from 'react';
import type * as THREE from 'three';
import { canWebGl, pinCapabilityOff, useCapabilityTier, usePrefersReducedMotion, type FxFailureSite } from './capability';
import { FxContext } from './fx-boundary';
import { loadThree, type ThreeModule } from './load-three';
import type { EffectTier } from './tiers';

/** A rect in the seam element's own coordinate space (CSS px, origin top-left). */
export interface FxRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type FxPointerKind = 'fine' | 'coarse' | 'none';

/** What the seam hands a scene. Live: the size and exclusions update on resize. */
export interface FxSceneContext {
    /** The resolved tier the scene renders at (never `off`: at `off` nothing mounts). */
    readonly tier: Exclude<EffectTier, 'off'>;
    /** The capped device pixel ratio in force (≤ 2 at `full`, ≤ 1.5 at `lite`). */
    readonly dpr: number;
    readonly width: number;
    readonly height: number;
    /** The host's exclusion elements, measured relative to the seam element. */
    readonly exclusions: readonly FxRect[];
    readonly pointerKind: FxPointerKind;
    /** The seam-owned scene graph. Everything added here is disposed on unmount. */
    readonly scene: THREE.Scene;
    readonly renderer: THREE.WebGLRenderer;
    readonly canvas: HTMLCanvasElement;
    /** Wake a parked loop for at least one frame. */
    requestFrame(): void;
}

/** Per-frame inputs. */
export interface FxFrameInputs {
    /** The pointer relative to the seam element; `active` when within `pointerMargin` of it. */
    readonly pointer: { readonly x: number; readonly y: number; readonly active: boolean };
    /** The host's `playing` prop (e.g. the hero's audio transport). */
    readonly playing: boolean;
}

/** A scene: brand content an effect draws. Implement these two and nothing else. */
export interface FxScene {
    /** Populate `ctx.scene` and return the camera to render it with. */
    build(three: ThreeModule, ctx: FxSceneContext): THREE.Camera | Promise<THREE.Camera>;
    /**
     * Advance one frame: `t` = seconds since the loop first ran, `dt` = seconds since the previous
     * rendered frame (capped at 0.1 after a pause). The seam renders after it returns. Return
     * `false` to park the loop until `ctx.requestFrame()` (or a nearby pointer) wakes it.
     */
    frame(t: number, dt: number, inputs: FxFrameInputs): void | boolean;
}

export interface FxCanvasProps {
    /**
     * Creates the scene; called once per mount, on first approach (so a dynamic `import()` here is
     * a lazily loaded chunk). Memoize it — a new function identity remounts the scene.
     */
    scene: () => FxScene | Promise<FxScene>;
    /** Pause the loop (the visitor's pause when the host keeps the tier on). */
    paused?: boolean;
    /** Forwarded to `inputs.playing`. */
    playing?: boolean;
    /** Elements the scene must compose around; measured on mount and on resize. */
    exclusions?: () => Iterable<Element | null | undefined>;
    /** How far outside the element (px) the pointer still counts as active and wakes the loop. */
    pointerMargin?: number;
    /** The lazy mount's IntersectionObserver `rootMargin` (default `'25%'`). */
    rootMargin?: string;
    /** Classes for the inert element. When given, the element's positioning is the caller's. */
    className?: string;
    /** Inline style for the inert element; defaults to an absolutely positioned, inset-0 layer. */
    style?: CSSProperties;
}

const DEFAULT_STYLE: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };
const CANVAS_CSS = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
/** `fx:tick` measures kept before the seam clears them, so the timeline never grows unbounded. */
const MEASURE_CAP = 10_000;
let measured = 0;

function pointerKind(): FxPointerKind {
    if (typeof window === 'undefined' || !window.matchMedia) return 'none';
    if (window.matchMedia('(pointer: coarse)').matches) return 'coarse';
    if (window.matchMedia('(pointer: fine)').matches) return 'fine';
    return 'none';
}

function measureTick(start: number): void {
    try {
        performance.measure('fx:tick', { start, end: performance.now() });
        if (++measured >= MEASURE_CAP) {
            measured = 0;
            performance.clearMeasures('fx:tick');
        }
    } catch {
        // User Timing L3 unavailable — the tick still runs.
    }
}

interface Disposable {
    dispose?: () => void;
}

/**
 * Dispose every geometry, material and material texture reachable from `root`, each at most once:
 * `done` remembers what this mount already disposed, so a second pass (a late failure followed by
 * unmount, or a build that resolves after teardown) disposes only what was added since.
 */
function disposeGraph(root: THREE.Object3D, done: WeakSet<object>): void {
    const once = (resource: Disposable | undefined) => {
        if (!resource || done.has(resource)) return;
        done.add(resource);
        resource.dispose?.();
    };
    root.traverse((object) => {
        const o = object as THREE.Object3D & { geometry?: Disposable; material?: Disposable | Disposable[] };
        once(o.geometry);
        const materials = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const material of materials) {
            for (const value of Object.values(material)) {
                if (value && typeof value === 'object' && (value as { isTexture?: boolean }).isTexture) {
                    once(value as Disposable);
                }
            }
            once(material);
        }
    });
}

export function FxCanvas({
    scene,
    paused = false,
    playing = false,
    exclusions,
    pointerMargin = 0,
    rootMargin = '25%',
    className,
    style,
}: FxCanvasProps) {
    const fx = useContext(FxContext);
    const reducedMotion = usePrefersReducedMotion();
    const capability = useCapabilityTier();
    const tier: EffectTier = reducedMotion || capability === 'off' ? 'off' : fx ? fx.effectiveTier : 'full';

    const ref = useRef<HTMLDivElement>(null);
    const latest = useRef({ paused, playing, exclusions, pointerMargin });
    latest.current = { paused, playing, exclusions, pointerMargin };
    const controller = useRef<{ update(): void; wake(): void } | null>(null);

    useEffect(() => {
        controller.current?.update();
    }, [paused]);

    // A `playing` transition is new input: wake a parked loop for a frame so the scene sees it. The
    // viewport, visibility and pause guards still hold (`wake` runs only what `shouldRun` allows).
    useEffect(() => {
        controller.current?.wake();
    }, [playing]);

    useEffect(() => {
        const container = ref.current;
        if (!container || tier === 'off') return;

        let disposed = false;
        let built = false;
        let running = false;
        let parked = false;
        let lost = false;
        let visible = false;
        let hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
        let raf = 0;
        let startedAt = -1;
        let lastAt = -1;
        let renderer: THREE.WebGLRenderer | null = null;
        let graph: THREE.Scene | null = null;
        let camera: THREE.Camera | null = null;
        let active: FxScene | null = null;
        /** Every geometry, material, texture this mount has disposed (teardown is idempotent). */
        const released = new WeakSet<object>();

        const dprCap = tier === 'full' ? 2 : 1.5;
        const state = {
            tier: tier as Exclude<EffectTier, 'off'>,
            dpr: Math.min(window.devicePixelRatio || 1, dprCap),
            width: 1,
            height: 1,
            exclusions: [] as FxRect[],
            pointerKind: pointerKind(),
            scene: null as unknown as THREE.Scene,
            renderer: null as unknown as THREE.WebGLRenderer,
            canvas: null as unknown as HTMLCanvasElement,
            requestFrame,
        };
        const ctx: FxSceneContext = state;
        const pointer = { x: -1e9, y: -1e9, active: false };
        const inputs = { pointer, playing: latest.current.playing };

        function shouldRun() {
            return built && !disposed && !lost && visible && !hidden && !parked && !latest.current.paused;
        }
        function update() {
            if (shouldRun()) start();
            else stop();
        }
        function start() {
            if (running) return;
            running = true;
            lastAt = -1;
            raf = requestAnimationFrame(tick);
        }
        function stop() {
            if (!running) return;
            running = false;
            cancelAnimationFrame(raf);
        }
        function requestFrame() {
            parked = false;
            update();
        }

        function tick(now: number) {
            if (!running || !active || !renderer || !graph || !camera) return;
            const t0 = performance.now();
            if (startedAt < 0) startedAt = now;
            const dt = lastAt < 0 ? 0 : Math.min((now - lastAt) / 1000, 0.1);
            lastAt = now;
            inputs.playing = latest.current.playing;
            const keep = active.frame((now - startedAt) / 1000, dt, inputs);
            renderer.render(graph, camera);
            measureTick(t0);
            if (keep === false) {
                parked = true;
                running = false;
                return;
            }
            raf = requestAnimationFrame(tick);
        }

        function measure() {
            const rect = container!.getBoundingClientRect();
            state.width = container!.clientWidth || 1;
            state.height = container!.clientHeight || 1;
            const rects: FxRect[] = [];
            for (const el of latest.current.exclusions?.() ?? []) {
                if (!el) continue;
                const r = el.getBoundingClientRect();
                rects.push({ x: r.left - rect.left, y: r.top - rect.top, width: r.width, height: r.height });
            }
            state.exclusions = rects;
            renderer?.setSize(state.width, state.height, false);
        }

        // --- teardown: idempotent; also the late-failure path ---
        function onLost(event: Event) {
            event.preventDefault();
            lost = true;
            stop();
            requestAnimationFrame(() => {
                if (lost && !disposed) fail('context-lost', new Error('webglcontextlost with no webglcontextrestored within one frame'));
            });
        }
        function onRestored() {
            lost = false;
            requestFrame();
        }
        function teardownRenderer() {
            stop();
            if (graph) disposeGraph(graph, released);
            if (renderer) {
                const canvas = renderer.domElement;
                canvas.removeEventListener('webglcontextlost', onLost);
                canvas.removeEventListener('webglcontextrestored', onRestored);
                renderer.dispose();
                renderer.forceContextLoss();
                canvas.remove();
            }
            renderer = null;
            graph = null;
            camera = null;
            active = null;
            built = false;
        }
        function fail(site: FxFailureSite, error: unknown) {
            if (disposed) return;
            teardownRenderer();
            pinCapabilityOff(site, error);
        }

        async function mount() {
            let three: ThreeModule;
            let created: FxScene;
            try {
                [three, created] = await Promise.all([loadThree(), Promise.resolve().then(() => scene())]);
            } catch (error) {
                return fail('import', error);
            }
            // Torn down, or another effect on the page pinned the capability off while we loaded.
            if (disposed || !canWebGl()) return;
            try {
                renderer = new three.WebGLRenderer({ alpha: true, antialias: true });
            } catch (error) {
                return fail('renderer', error);
            }
            const mine = renderer;
            renderer.setPixelRatio(state.dpr);
            renderer.setClearColor(0x000000, 0);
            const canvas = renderer.domElement;
            canvas.style.cssText = CANVAS_CSS;
            canvas.addEventListener('webglcontextlost', onLost);
            canvas.addEventListener('webglcontextrestored', onRestored);
            container!.appendChild(canvas);
            const own = new three.Scene();
            graph = own;
            state.scene = own;
            state.renderer = renderer;
            state.canvas = canvas;
            measure();
            // Torn down (unmount, or a late failure) while the scene was building: `renderer` is no
            // longer this build's. Dispose whatever the build added after the teardown pass.
            const tornDown = () => disposed || renderer !== mine;
            let cam: THREE.Camera;
            try {
                cam = await created.build(three, ctx);
            } catch (error) {
                if (tornDown()) return disposeGraph(own, released);
                // A scene bug, not a WebGL failure: drop this scene, keep the capability.
                console.warn(`[beam-ux-canvas] scene failed: ${error instanceof Error ? error.message : String(error)}`);
                teardownRenderer();
                return;
            }
            if (tornDown()) return disposeGraph(own, released);
            camera = cam;
            active = created;
            built = true;
            mine.render(own, cam);
            update();
        }

        // --- observers + listeners ---
        const approach = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                approach.disconnect();
                void mount();
            },
            { rootMargin },
        );
        approach.observe(container);

        const viewport = new IntersectionObserver(
            (entries) => {
                const entry = entries[entries.length - 1];
                const wasVisible = visible;
                visible = entry.isIntersecting;
                if (visible && !wasVisible) parked = false;
                update();
            },
            { threshold: 0.01 },
        );
        viewport.observe(container);

        const resize = new ResizeObserver(() => {
            measure();
            if (built) requestFrame();
        });
        resize.observe(container);
        for (const el of latest.current.exclusions?.() ?? []) if (el) resize.observe(el);

        const onVisibility = () => {
            hidden = document.visibilityState === 'hidden';
            update();
        };
        document.addEventListener('visibilitychange', onVisibility);

        const onMove = (e: PointerEvent) => {
            const r = container.getBoundingClientRect();
            const m = latest.current.pointerMargin;
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            pointer.x = x;
            pointer.y = y;
            pointer.active = x >= -m && x <= r.width + m && y >= -m && y <= r.height + m;
            if (pointer.active && parked) requestFrame();
        };
        const onLeave = () => {
            pointer.active = false;
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerleave', onLeave);

        controller.current = {
            update,
            wake() {
                if (built && parked) requestFrame();
            },
        };

        return () => {
            disposed = true;
            controller.current = null;
            approach.disconnect();
            viewport.disconnect();
            resize.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerleave', onLeave);
            teardownRenderer();
        };
        // `rootMargin` is read once per mount; `scene` identity remounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tier, scene]);

    return (
        <div ref={ref} aria-hidden="true" className={className} style={style ?? (className === undefined ? DEFAULT_STYLE : undefined)} />
    );
}
