/**
 * `ParticleObject` past its renderer: the image loads, its opaque pixels are sampled into point
 * homes, one `Points` cloud is added to the seam's scene, and the seam renders it (landing-motion
 * amend 01, the Codex review's question; `particle-object.test.tsx` stops at the renderer's
 * construction, before the asynchronous image build). jsdom with WebGL true and reduced motion false
 * at the browser seam (`mockEnvironment`), `three` stubbed, and the two browser pieces jsdom lacks
 * mocked: `Image` loads at once at 40 × 20, and the 2D context's `getImageData` answers a buffer whose
 * left half is opaque. Nothing draws; the pixels are the harness's.
 */
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { resetCapabilityForTests } from './capability';
import { ParticleObject } from './particle-object';
import { mockEnvironment, renderers, resetThreeStub } from './test-support';

vi.mock('three', async () => (await import('./test-support')).threeModuleStub());

beforeEach(() => {
    resetThreeStub();
    resetCapabilityForTests();
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it('loads and samples the image, adds one Points cloud of at most `count` points at their homes, and renders it', async () => {
    const env = mockEnvironment({ webgl: true, reducedMotion: false });
    // Re-states mockEnvironment's WebGL answer (the probe sees a context) and adds the 2D context.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, kind: string) {
        if (kind !== '2d') return kind.includes('webgl') ? ({} as never) : null;
        const canvas = this;
        return {
            drawImage: vi.fn(),
            getImageData: (_x: number, _y: number, w: number, h: number) => {
                const data = new Uint8ClampedArray(w * h * 4);
                for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) data[(y * w + x) * 4 + 3] = 255;
                expect([w, h]).toEqual([canvas.width, canvas.height]);
                return { data, width: w, height: h };
            },
        } as never;
    } as typeof HTMLCanvasElement.prototype.getContext);
    const loaded: string[] = [];
    vi.stubGlobal(
        'Image',
        class {
            width = 40;
            height = 20;
            crossOrigin = '';
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            set src(value: string) {
                loaded.push(value);
                queueMicrotask(() => this.onload?.());
            }
        },
    );

    render(createElement(ParticleObject, { src: '/mark.png', tint: '#00b3c8', count: 500 }));
    await vi.waitFor(() => expect(renderers[0]?.render).toHaveBeenCalled());
    expect(loaded).toEqual(['/mark.png']);

    const [scene] = renderers[0].render.mock.calls[0] as [{ children: { geometry?: { attributes: Record<string, { array: Float32Array }> } }[] }];
    expect(scene.children).toHaveLength(1);
    const positions = scene.children[0].geometry!.attributes.position.array;
    const points = positions.length / 3;
    // A 220 × 110 buffer, its left half opaque: 12,100 opaque pixels, subsampled to ≤ 500.
    expect(points).toBeGreaterThan(400);
    expect(points).toBeLessThanOrEqual(500);
    // Seeded at home, inside the element's left half (jsdom's 1 × 1 box contains the 2:1 mark).
    for (let i = 0; i < points; i++) expect(positions[i * 3]).toBeLessThanOrEqual(0.5);

    env.flushFrames(1);
    expect(renderers[0].render.mock.calls.length).toBeGreaterThanOrEqual(2);
});
