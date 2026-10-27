import { defineConfig } from 'vitest/config';

// The package's suite runs in jsdom. jsdom has no WebGL, no IntersectionObserver and no
// matchMedia, so every case mocks the capability probe and the media query it depends on
// and stubs `three`'s renderer (see `src/test-support.ts`). Live tiers in a real browser are
// the ecosystem harness's (`harness/specs/g1-beam-ux-canvas-tiers.spec.ts`), never this suite's.
export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
