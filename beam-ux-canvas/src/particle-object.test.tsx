/**
 * `ParticleObject` keeps its standalone behaviour (landing-motion build/01; ticket 12 Q20).
 * splicewire/www renders it with NO `<FxBoundary>` (`resources/js/components/marketing/beam-content.tsx:101`),
 * so outside a boundary it must still self-gate on WebGL + reduced motion, always render its inert
 * `aria-hidden` div, and dispose + force-lose its context on unmount.
 *
 * Written to run unchanged against the component before the move onto the lifecycle seam (beam
 * `c339a17`) and after it: every assertion waits for the renderer rather than assuming the
 * construction is synchronous, and each case loads a fresh module graph so the capability
 * module's cached WebGL probe never leaks between cases.
 */
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEnvironment, renderers, resetThreeStub, settle } from './test-support';

vi.mock('three', async () => (await import('./test-support')).threeModuleStub());

async function loadParticleObject() {
    vi.resetModules();
    return (await import('./particle-object')).ParticleObject;
}

function mountedDiv(container: HTMLElement): HTMLElement {
    const div = container.firstElementChild as HTMLElement;
    expect(div).not.toBeNull();
    expect(div.tagName).toBe('DIV');
    expect(div.getAttribute('aria-hidden')).toBe('true');
    expect(div.className).toContain('pointer-events-none');
    return div;
}

describe('ParticleObject standalone (no FxBoundary)', () => {
    beforeEach(() => resetThreeStub());
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('capable (WebGL, no reduced motion): the aria-hidden div and one renderer with its canvas appended', async () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const ParticleObject = await loadParticleObject();
        const { container } = render(createElement(ParticleObject, { src: '/mark.png', tint: '#00b3c8' }));
        const div = mountedDiv(container);

        await vi.waitFor(() => expect(renderers).toHaveLength(1));
        await settle();
        expect(renderers).toHaveLength(1);
        expect(div.querySelectorAll('canvas')).toHaveLength(1);
        expect(div.querySelector('canvas')).toBe(renderers[0].domElement);
    });

    it('reduced motion: the div, no renderer and no canvas', async () => {
        mockEnvironment({ webgl: true, reducedMotion: true });
        const ParticleObject = await loadParticleObject();
        const { container } = render(createElement(ParticleObject, { src: '/mark.png', tint: '#00b3c8' }));
        const div = mountedDiv(container);

        await settle(5);
        expect(renderers).toHaveLength(0);
        expect(container.querySelectorAll('canvas')).toHaveLength(0);
        expect(div.childElementCount).toBe(0);
    });

    it('no WebGL: the div, no renderer and no canvas', async () => {
        mockEnvironment({ webgl: false, reducedMotion: false });
        const ParticleObject = await loadParticleObject();
        const { container } = render(createElement(ParticleObject, { src: '/mark.png', tint: '#00b3c8' }));
        const div = mountedDiv(container);

        await settle(5);
        expect(renderers).toHaveLength(0);
        expect(container.querySelectorAll('canvas')).toHaveLength(0);
        expect(div.childElementCount).toBe(0);
    });

    it('unmount after the capable case: dispose() and forceContextLoss() each called once', async () => {
        mockEnvironment({ webgl: true, reducedMotion: false });
        const ParticleObject = await loadParticleObject();
        const { container, unmount } = render(createElement(ParticleObject, { src: '/mark.png', tint: '#00b3c8' }));
        await vi.waitFor(() => expect(renderers).toHaveLength(1));
        await settle();
        const [renderer] = renderers;

        unmount();
        await settle();
        expect(renderer.dispose).toHaveBeenCalledTimes(1);
        expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
        expect(container.querySelectorAll('canvas')).toHaveLength(0);
    });
});
