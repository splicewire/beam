/**
 * A GPU point cloud sampled from a source image, with cursor scatter + spring-damper return.
 * Promoted out of splicewire-app's app-local beam-ux-canvas prototype
 * (ui/src/_prototype/beam-ux-canvas/_fx/ParticleObject.tsx, ticket 02) — the same physics, now a
 * real package surface.
 *
 * "Effects decorate, they never replace" (the package's load-bearing doctrine): this component is
 * a `pointer-events-none`, `aria-hidden` overlay. It renders NOTHING real — a host mounts it
 * alongside its own real DOM (e.g. a logo `<img>`), never in place of it. It self-gates behind
 * {@link canWebGl} and {@link prefersReducedMotion}: no WebGL context, or the OS asks for reduced
 * motion, and it mounts an empty, inert div.
 *
 * Perf hygiene: the animation loop pauses when scrolled offscreen (IntersectionObserver) and, on
 * unmount, disposes geometry + material + renderer and force-loses the GL context — no leaks
 * across mounts. `animateIdle: false` additionally PARKS the loop once the cloud settles with no
 * cursor near, waking only on pointer activity — the `lite` tier's whole perf story.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { canWebGl, prefersReducedMotion } from './capability';

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

export function ParticleObject({ src, tint, count = 3500, animateIdle = true, className }: ParticleObjectProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !canWebGl() || prefersReducedMotion()) return;

        let disposed = false;
        let raf = 0;
        let running = false;
        let visible = true;
        // Below this total kinetic energy the cloud is "at rest" (parkable when !animateIdle).
        const REST_ENERGY = 0.02;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1); // set in layout()

        const pointer = { x: -1e9, y: -1e9, active: false };
        let homesNorm: Float32Array = new Float32Array(0); // [0,1] per point (2 each)
        let homesPx: Float32Array = new Float32Array(0); // pixel space (2 each)
        let velocities: Float32Array = new Float32Array(0); // (2 each)
        let positions: Float32Array = new Float32Array(0); // geometry buffer (3 each)
        let geometry: THREE.BufferGeometry | null = null;
        let material: THREE.PointsMaterial | null = null;
        let points: THREE.Points | null = null;
        let width = 0;
        let height = 0;
        let markW = 1;
        let markH = 1;

        function layout() {
            width = container!.clientWidth || 1;
            height = container!.clientHeight || 1;
            renderer.setSize(width, height, false);
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

        function start() {
            if (running || disposed) return;
            running = true;
            raf = requestAnimationFrame(tick);
        }
        function stop() {
            running = false;
            cancelAnimationFrame(raf);
        }

        function tick() {
            if (!running || disposed || !geometry) return;
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
            renderer.render(scene, camera);
            // lite (animateIdle=false): once the cloud settles and the cursor is away, PARK the
            // loop — no idle GPU churn. A pointermove near the object wakes it via onMove → start().
            if (!animateIdle && !pointer.active && energy / Math.max(n, 1) < REST_ENERGY) {
                stop();
                return;
            }
            raf = requestAnimationFrame(tick);
        }

        // --- image load → sample → build scene ---
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (disposed) return;
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

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions as Float32Array<ArrayBuffer>, 3));
            material = new THREE.PointsMaterial({
                color: new THREE.Color(tint),
                size: Math.min(window.devicePixelRatio || 1, 2) * 2,
                sizeAttenuation: false,
                transparent: true,
                opacity: 0.92,
            });
            points = new THREE.Points(geometry, material);
            scene.add(points);
            renderer.render(scene, camera);
            start();
        };
        img.src = src;

        // --- observers + pointer ---
        const io = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
                visible ? start() : stop();
            },
            { threshold: 0.01 },
        );
        io.observe(container);

        const ro = new ResizeObserver(() => {
            if (homesNorm.length) layout();
        });
        ro.observe(container);

        const onMove = (e: PointerEvent) => {
            const r = container.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            pointer.active = x >= -REPEL_RADIUS && x <= r.width + REPEL_RADIUS && y >= -REPEL_RADIUS && y <= r.height + REPEL_RADIUS;
            pointer.x = x;
            pointer.y = y;
            // Wake a parked (lite) loop when the cursor comes near while on-screen.
            if (pointer.active && visible) start();
        };
        const onLeave = () => (pointer.active = false);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerleave', onLeave);

        return () => {
            disposed = true;
            stop();
            io.disconnect();
            ro.disconnect();
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerleave', onLeave);
            geometry?.dispose();
            material?.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
    }, [src, tint, count, animateIdle]);

    return <div ref={containerRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className ?? ''}`} />;
}
