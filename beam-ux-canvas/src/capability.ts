/**
 * Capability + reduced-motion detection — the two hard kill switches every effect in this package
 * respects. Kept out of React where possible so a probe runs once, cheaply.
 *
 * The WebGL probe is cached for the page lifetime. A late failure after a passing probe (a rejected
 * `import()`, a throwing renderer constructor, a context lost and not restored — the lifecycle
 * seam's three failure sites, landing-motion ticket 06 Q30) flips that cached answer to `false` via
 * {@link pinCapabilityOff}: in memory only, never persisted, so a full reload re-probes while every
 * boundary on the page resolves `off` from then on and nothing retries in a loop.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { EffectTier } from './tiers';

/** Can we get a WebGL context at all? One probe, cached. */
let webglProbe: boolean | null = null;
/** Whether the one late-failure warning has been written on this page. */
let warned = false;
const listeners = new Set<() => void>();

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

/** Device/browser ceiling: `full` if WebGL is available (and not pinned off), else a hard `off`. */
export function detectCapabilityTier(): EffectTier {
    return canWebGl() ? 'full' : 'off';
}

/** The lifecycle seam's late-failure sites (ticket 06 Q30). */
export type FxFailureSite = 'import' | 'renderer' | 'context-lost';

/**
 * Pin the capability `off` for the page lifetime after a late WebGL failure: flips the cached
 * probe to `false`, writes ONE `console.warn` per page with the stable prefix
 * `[beam-ux-canvas] effect disabled: <site>: <message>`, and notifies every subscribed boundary and
 * seam so they re-resolve to `off`. In memory only — never persisted.
 */
export function pinCapabilityOff(site: FxFailureSite, error: unknown): void {
    webglProbe = false;
    if (!warned) {
        warned = true;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[beam-ux-canvas] effect disabled: ${site}: ${message}`);
    }
    for (const listener of [...listeners]) listener();
}

/** Subscribe to capability changes (the late-failure pin). Returns the unsubscribe. */
export function subscribeCapability(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * The live capability tier: probes once, then follows the late-failure pin so an already-mounted
 * boundary drops to `off` when another effect on the page fails. `off` on the server.
 */
export function useCapabilityTier(): EffectTier {
    return useSyncExternalStore(subscribeCapability, detectCapabilityTier, () => 'off');
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

/**
 * Test-only: forget the cached probe and the one-warning latch so a jsdom case can state a fresh
 * capability. Not exported from the package entry.
 */
export function resetCapabilityForTests(): void {
    webglProbe = null;
    warned = false;
    for (const listener of [...listeners]) listener();
}
