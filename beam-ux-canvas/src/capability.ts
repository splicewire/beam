/**
 * Capability + reduced-motion detection — the two hard kill switches every effect in this package
 * respects. Kept out of React where possible so a probe runs once, cheaply.
 */
import { useEffect, useState } from 'react';

/** Can we get a WebGL context at all? One probe, cached. */
let webglProbe: boolean | null = null;
export function canWebGl(): boolean {
    if (webglProbe !== null) return webglProbe;
    if (typeof document === 'undefined') return (webglProbe = false);
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
        webglProbe = gl != null;
    } catch {
        webglProbe = false;
    }
    return webglProbe;
}

/**
 * The renderer-swap upgrade point (webgl-overlay → html-in-canvas), stubbed. The HTML-in-Canvas
 * origin trial is Chrome-only + experimental and not shipped, so this is a capability-gated no-op
 * that returns `false` today. When it ships, this flips to a real feature-detect and a host's
 * renderer selection can pick `html-in-canvas` instead — no component-tree change required.
 */
export function canHtmlInCanvas(): boolean {
    return false;
}

/** One-time `prefers-reduced-motion: reduce` read, for effects that only probe on mount. */
export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Live `prefers-reduced-motion: reduce`, tracked across OS changes. */
export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduced(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return reduced;
}
