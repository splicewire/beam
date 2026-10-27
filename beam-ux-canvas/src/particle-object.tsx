/**
 * A GPU point cloud sampled from a source image, with cursor scatter + spring-damper return.
 * Promoted out of splicewire-app's app-local beam-ux-canvas prototype
 * (ui/src/_prototype/beam-ux-canvas/_fx/ParticleObject.tsx, ticket 02) — the same physics, now a
 * real package surface, and the lifecycle seam's first consumer (`FxCanvas`).
 *
 * "Effects decorate, they never replace" (the package's load-bearing doctrine): this component is
 * a `pointer-events-none`, `aria-hidden` overlay. It renders NOTHING real — a host mounts it
 * alongside its own real DOM (e.g. a logo `<img>`), never in place of it. It self-gates behind
 * {@link canWebGl} and reduced motion with or without an `FxBoundary` (splicewire/www renders it
 * standalone): no WebGL context, or the OS asks for reduced motion, and it mounts an empty, inert div.
 *
 * Perf hygiene is the seam's: the loop pauses offscreen and on a hidden tab, and on unmount the
 * geometry, material and renderer are disposed and the GL context force-lost. `animateIdle: false`
 * additionally PARKS the loop once the cloud settles with no cursor near, waking only on pointer
 * activity — the `lite` tier's whole perf story.
 */
import { useCallback } from 'react';
import type * as THREE from 'three';
import { FxCanvas, type FxScene, type FxSceneContext } from './fx-canvas';
import type { ThreeModule } from './load-three';

export interface ParticleObjectProps {
    /** Source image sampled into points. */
    src: string;
    /** Point tint (hex). */
    tint: string;
    /** Target max points. */
    count?: number;
    /** `true` runs the loop continuously. `false` parks it at rest (see perf hygiene above). */
    animateIdle?: boolean;
    className?: string;
}

// Spring-damper + cursor-repulsion constants (pixel space).
const STIFFNESS = 0.022;
const DAMPING = 0.86;
const REPEL = 2600;
const REPEL_RADIUS = 70;
// Below this mean kinetic energy the cloud is "at rest" (parkable when !animateIdle).
const REST_ENERGY = 0.02;

/** Draw `img` centered/contained into a small buffer and collect opaque pixel homes in [0,1]. */
function sampleHomes(img: HTMLImageElement, target: number): Float32Array {
    const bufW = 220;
    const bufH = Math.max(1, Math.round((bufW * img.height) / img.width));
    const c = document.createElement('canvas');
    c.width = bufW;
    c.height = bufH;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, bufW, bufH);
    const data = ctx.getImageData(0, 0, bufW, bufH).data;

    const opaque: number[] = [];
    for (let y = 0; y < bufH; y++) {
        for (let x = 0; x < bufW; x++) {
            if (data[(y * bufW + x) * 4 + 3] > 128) {
                opaque.push(x / bufW, y / bufH);
            }
        }
    }
    const total = opaque.length / 2;
    // Deterministic subsample down to the target count.
    const stride = Math.max(1, Math.ceil(total / target));
    const homes: number[] = [];
    for (let i = 0; i < total; i += stride) {
        homes.push(opaque[i * 2], opaque[i * 2 + 1]);
    }
    return new Float32Array(homes);
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`ParticleObject could not load ${src}`));
        img.src = src;
    });
}

interface ParticleSceneOptions {
    src: string;
    tint: string;
    count: number;
    animateIdle: boolean;
}

/** The point cloud as a seam scene: `build` samples the image, `frame` runs the physics. */
export function createParticleScene({ src, tint, count, animateIdle }: ParticleSceneOptions): FxScene {
    let ctx: FxSceneContext;
    let camera: THREE.OrthographicCamera;
    let geometry: THREE.BufferGeometry;
    let homesNorm: Float32Array = new Float32Array(0); // [0,1] per point (2 each)
    let homesPx: Float32Array = new Float32Array(0); // pixel space (2 each)
    let velocities: Float32Array = new Float32Array(0); // (2 each)
    let positions: Float32Array = new Float32Array(0); // geometry buffer (3 each)
    let markW = 1;
    let markH = 1;
    let laidOutW = 0;
    let laidOutH = 0;

    function layout() {
        const { width, height } = ctx;
        laidOutW = width;
        laidOutH = height;
        camera.left = 0;
        camera.right = width;
        camera.top = 0;
        camera.bottom = height;
        camera.updateProjectionMatrix();
        // Rebuild pixel homes from normalized homes, contained + centered on the shorter axis.
        const n = homesNorm.length / 2;
        const markAspect = markW / markH;
        const boxAspect = width / height;
        let dw = width;
        let dh = height;
        if (markAspect > boxAspect) dh = width / markAspect;
        else dw = height * markAspect;
        const ox = (width - dw) / 2;
        const oy = (height - dh) / 2;
        for (let i = 0; i < n; i++) {
            homesPx[i * 2] = ox + homesNorm[i * 2] * dw;
            homesPx[i * 2 + 1] = oy + homesNorm[i * 2 + 1] * dh;
        }
    }

    return {
        async build(three: ThreeModule, sceneCtx: FxSceneContext) {
            ctx = sceneCtx;
            camera = new three.OrthographicCamera(0, 1, 0, 1, -1, 1); // set in layout()
            const img = await loadImage(src);
            markW = img.width;
            markH = img.height;
            homesNorm = sampleHomes(img, count);
            const n = homesNorm.length / 2;
            homesPx = new Float32Array(n * 2);
            velocities = new Float32Array(n * 2);
            positions = new Float32Array(n * 3);

            layout();
            // Seed positions AT home so the mark reads immediately, then physics keeps it lively.
            for (let i = 0; i < n; i++) {
                positions[i * 3] = homesPx[i * 2];
                positions[i * 3 + 1] = homesPx[i * 2 + 1];
                positions[i * 3 + 2] = 0;
            }

            geometry = new three.BufferGeometry();
            geometry.setAttribute('position', new three.BufferAttribute(positions as Float32Array<ArrayBuffer>, 3));
            const material = new three.PointsMaterial({
                color: new three.Color(tint),
                size: ctx.dpr * 2,
                sizeAttenuation: false,
                transparent: true,
                opacity: 0.92,
            });
            ctx.scene.add(new three.Points(geometry, material));
            return camera;
        },

        frame(_t, _dt, { pointer }) {
            if (ctx.width !== laidOutW || ctx.height !== laidOutH) layout();
            const n = homesPx.length / 2;
            const pos = positions;
            let energy = 0;
            for (let i = 0; i < n; i++) {
                const ix = i * 2;
                const px = pos[i * 3];
                const py = pos[i * 3 + 1];
                let ax = (homesPx[ix] - px) * STIFFNESS;
                let ay = (homesPx[ix + 1] - py) * STIFFNESS;
                if (pointer.active) {
                    const dx = px - pointer.x;
                    const dy = py - pointer.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < REPEL_RADIUS * REPEL_RADIUS) {
                        const d = Math.sqrt(d2) + 0.001;
                        const f = (REPEL * (1 - d / REPEL_RADIUS)) / d;
                        ax += dx * f;
                        ay += dy * f;
                    }
                }
                const vx = (velocities[ix] + ax) * DAMPING;
                const vy = (velocities[ix + 1] + ay) * DAMPING;
                velocities[ix] = vx;
                velocities[ix + 1] = vy;
                energy += vx * vx + vy * vy;
                pos[i * 3] = px + vx;
                pos[i * 3 + 1] = py + vy;
            }
            geometry.attributes.position.needsUpdate = true;
            // lite (animateIdle=false): once the cloud settles and the cursor is away, PARK the
            // loop — no idle GPU churn. A pointer near the object wakes it (the seam's pointerMargin).
            if (!animateIdle && !pointer.active && energy / Math.max(n, 1) < REST_ENERGY) return false;
        },
    };
}

export function ParticleObject({ src, tint, count = 3500, animateIdle = true, className }: ParticleObjectProps) {
    const scene = useCallback(() => createParticleScene({ src, tint, count, animateIdle }), [src, tint, count, animateIdle]);
    return (
        <FxCanvas scene={scene} pointerMargin={REPEL_RADIUS} className={`pointer-events-none absolute inset-0 ${className ?? ''}`} />
    );
}
