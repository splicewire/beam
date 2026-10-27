/**
 * A story-only scene for `fx-tiers.stories.tsx`: a slowly turning wireframe icosahedron. It exists
 * to prove the seam mounts, runs and disposes a real WebGL scene in a browser; it is not brand
 * content and is not exported from the package (scenes belong to hosts — landing-motion ticket 04 Q2).
 * Loaded through a dynamic `import()` so the story exercises the seam's lazy chunk.
 */
import type * as THREE from 'three';
import type { FxScene } from './fx-canvas';

export function createDemoScene(): FxScene {
    let camera: THREE.PerspectiveCamera;
    let mesh: THREE.Mesh;
    let ctxSize = { width: 1, height: 1 };
    let read: () => { width: number; height: number };
    return {
        build(three, ctx) {
            read = () => ({ width: ctx.width, height: ctx.height });
            ctxSize = read();
            camera = new three.PerspectiveCamera(40, ctx.width / ctx.height, 0.1, 100);
            camera.position.z = 6;
            mesh = new three.Mesh(
                new three.IcosahedronGeometry(1.6, ctx.tier === 'full' ? 2 : 1),
                new three.MeshBasicMaterial({ color: 0xff6a3d, wireframe: true, transparent: true, opacity: 0.55 }),
            );
            ctx.scene.add(mesh);
            return camera;
        },
        frame(_t, dt) {
            const size = read();
            if (size.width !== ctxSize.width || size.height !== ctxSize.height) {
                ctxSize = size;
                camera.aspect = size.width / size.height;
                camera.updateProjectionMatrix();
            }
            mesh.rotation.x += dt * 0.3;
            mesh.rotation.y += dt * 0.5;
        },
    };
}
