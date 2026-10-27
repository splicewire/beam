/**
 * Test doubles for the package's jsdom suite. jsdom has no WebGL, no IntersectionObserver, no
 * ResizeObserver and no `matchMedia`, so every case states its environment through
 * {@link mockEnvironment}: the capability probe (`getContext('webgl2'|'webgl')`) and the
 * `prefers-reduced-motion` media query are mocked at the browser seam, so the package's own
 * `canWebGl()` / `detectCapabilityTier()` / `usePrefersReducedMotion()` run unmodified against them.
 * `three`'s renderer is replaced by {@link threeModuleStub} (wire it with
 * `vi.mock('three', async () => (await import('./test-support')).threeModuleStub())`).
 *
 * Not exported from the package entry; tsup bundles only what `src/index.ts` reaches.
 */
import { vi } from 'vitest';

export interface RendererStub {
    domElement: HTMLCanvasElement;
    setPixelRatio: ReturnType<typeof vi.fn>;
    setClearColor: ReturnType<typeof vi.fn>;
    setSize: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    forceContextLoss: ReturnType<typeof vi.fn>;
}

// Kept on globalThis: a case that calls `vi.resetModules()` re-evaluates this module inside the
// fresh graph the mocked `three` imports, and both copies must share one record.
const shared = ((globalThis as Record<string, unknown>).__beamUxCanvasThreeStub ??= {
    renderers: [] as RendererStub[],
    rendererFailure: { next: null as Error | null },
}) as { renderers: RendererStub[]; rendererFailure: { next: Error | null } };

/** Every `WebGLRenderer` the stubbed `three` constructed, in order. Reset per case. */
export const renderers: RendererStub[] = shared.renderers;

/** When set, the next stubbed `WebGLRenderer` constructor throws it (the late-failure site). */
export const rendererFailure: { next: Error | null } = shared.rendererFailure;

export function resetThreeStub(): void {
    renderers.length = 0;
    rendererFailure.next = null;
}

/** A `three` module double: enough surface for the package's seam and `ParticleObject`. */
export function threeModuleStub(): Record<string, unknown> {
    class WebGLRenderer implements RendererStub {
        domElement = document.createElement('canvas');
        setPixelRatio = vi.fn();
        setClearColor = vi.fn();
        setSize = vi.fn();
        render = vi.fn();
        dispose = vi.fn();
        forceContextLoss = vi.fn();
        constructor() {
            if (rendererFailure.next) {
                const err = rendererFailure.next;
                rendererFailure.next = null;
                throw err;
            }
            renderers.push(this);
        }
    }
    class Object3D {
        children: Object3D[] = [];
        add(...objs: Object3D[]) {
            this.children.push(...objs);
            return this;
        }
        remove() {
            return this;
        }
        traverse(fn: (o: Object3D) => void) {
            fn(this);
            for (const c of this.children) c.traverse(fn);
        }
    }
    class Scene extends Object3D {}
    class Camera extends Object3D {
        left = 0;
        right = 1;
        top = 0;
        bottom = 1;
        updateProjectionMatrix = vi.fn();
    }
    class OrthographicCamera extends Camera {}
    class PerspectiveCamera extends Camera {}
    class BufferGeometry {
        attributes: Record<string, { needsUpdate: boolean }> = {};
        setAttribute(name: string, attr: { needsUpdate: boolean }) {
            this.attributes[name] = attr;
        }
        dispose = vi.fn();
    }
    class BufferAttribute {
        needsUpdate = false;
        constructor(
            public array: ArrayLike<number>,
            public itemSize: number,
        ) {}
    }
    class PointsMaterial {
        dispose = vi.fn();
    }
    class Points extends Object3D {
        constructor(
            public geometry: BufferGeometry,
            public material: PointsMaterial,
        ) {
            super();
        }
    }
    class Color {
        constructor(public value: unknown) {}
    }
    class Texture {
        isTexture = true;
        dispose = vi.fn();
    }
    return {
        WebGLRenderer,
        Object3D,
        Scene,
        OrthographicCamera,
        PerspectiveCamera,
        BufferGeometry,
        BufferAttribute,
        PointsMaterial,
        Points,
        Color,
        Texture,
    };
}

export interface EnvironmentOptions {
    /** `getContext('webgl2' | 'webgl')` answers a context (true) or `null` (false). */
    webgl: boolean;
    /** `matchMedia('(prefers-reduced-motion: reduce)').matches`. */
    reducedMotion: boolean;
    /** Whether IntersectionObserver reports the target intersecting on observe (default true). */
    intersecting?: boolean;
}

/** Controls handed back by {@link mockEnvironment} to drive the observers a case needs. */
export interface EnvironmentControls {
    /** Fire every live IntersectionObserver with the given intersecting state. */
    intersect(isIntersecting: boolean): void;
    /** The options each IntersectionObserver was constructed with, in order. */
    observerOptions: IntersectionObserverInit[];
    /** Run queued animation frames (the stubbed rAF never runs on its own). */
    flushFrames(count?: number): void;
    /** Animation frames currently queued. */
    pendingFrames(): number;
    /** Fire every live ResizeObserver; returns the elements they observe. */
    resize(): Element[];
}

/**
 * Mock the browser seams the package reads. Installs: a `getContext` spy (the WebGL capability
 * probe), `matchMedia` (reduced motion; `(pointer: coarse)` false), IntersectionObserver and
 * ResizeObserver stubs, and a manual `requestAnimationFrame` queue.
 */
export function mockEnvironment({ webgl, reducedMotion, intersecting = true }: EnvironmentOptions): EnvironmentControls {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (kind: string) {
        return webgl && kind.includes('webgl') ? ({} as RenderingContext) : null;
    } as typeof HTMLCanvasElement.prototype.getContext);

    window.matchMedia = vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const observers: { cb: IntersectionObserverCallback; targets: Element[]; self: IntersectionObserver }[] = [];
    const observerOptions: IntersectionObserverInit[] = [];
    class IO {
        private record: (typeof observers)[number];
        constructor(cb: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
            observerOptions.push(options);
            this.record = { cb, targets: [], self: this as unknown as IntersectionObserver };
            observers.push(this.record);
        }
        observe(target: Element) {
            this.record.targets.push(target);
            queueMicrotask(() => {
                if (!observers.includes(this.record)) return;
                this.record.cb(
                    [{ isIntersecting: intersecting, target, intersectionRatio: intersecting ? 1 : 0 } as IntersectionObserverEntry],
                    this.record.self,
                );
            });
        }
        unobserve() {}
        disconnect() {
            const i = observers.indexOf(this.record);
            if (i >= 0) observers.splice(i, 1);
        }
        takeRecords() {
            return [];
        }
    }
    vi.stubGlobal('IntersectionObserver', IO);

    const resizers: { cb: ResizeObserverCallback; targets: Element[]; self: ResizeObserver }[] = [];
    class RO {
        private record: (typeof resizers)[number];
        constructor(cb: ResizeObserverCallback) {
            this.record = { cb, targets: [], self: this as unknown as ResizeObserver };
            resizers.push(this.record);
        }
        observe(target: Element) {
            this.record.targets.push(target);
        }
        unobserve() {}
        disconnect() {
            const i = resizers.indexOf(this.record);
            if (i >= 0) resizers.splice(i, 1);
        }
    }
    vi.stubGlobal('ResizeObserver', RO);

    let frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        frames.set(++nextFrame, cb);
        return nextFrame;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        frames.delete(id);
    });

    return {
        observerOptions,
        intersect(isIntersecting: boolean) {
            for (const o of [...observers]) {
                o.cb(
                    o.targets.map(
                        (target) => ({ isIntersecting, target, intersectionRatio: isIntersecting ? 1 : 0 }) as IntersectionObserverEntry,
                    ),
                    o.self,
                );
            }
        },
        pendingFrames() {
            return frames.size;
        },
        resize() {
            const seen: Element[] = [];
            for (const r of [...resizers]) {
                seen.push(...r.targets);
                r.cb(r.targets.map((target) => ({ target }) as ResizeObserverEntry), r.self);
            }
            return seen;
        },
        flushFrames(count = 1) {
            for (let i = 0; i < count; i++) {
                const batch = [...frames.values()];
                frames = new Map();
                for (const cb of batch) cb(performance.now());
            }
        },
    };
}

/** Let pending microtasks and a macrotask settle (dynamic imports, observer callbacks). */
export async function settle(times = 3): Promise<void> {
    for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
}
