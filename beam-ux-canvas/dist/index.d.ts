import * as react from 'react';
import { CSSProperties, ReactNode } from 'react';
import * as THREE from 'three';

/**
 * The dynamic `three` loader. `three` is a peer dependency, never bundled into this package's
 * `dist` and never fetched from a CDN: the `import('three')` below stays a dynamic import in the
 * built output, so the host's bundler (Vite) splits `three` into its own chunk, requested only when
 * an effect is about to mount (landing-motion tickets 04 and 06 point 4).
 */
type ThreeModule = typeof THREE;
/** Load `three` once per page; a rejected load is not cached, so a later mount may retry. */
declare function loadThree(): Promise<ThreeModule>;

/**
 * The tier arithmetic behind the "visual effects" preference. Pure, so it unit-tests without a DOM
 * (`tiers.test.ts`). `<FxBoundary>` feeds it the user tier (a prop), the capability tier and the
 * reduced-motion fact; everything here is data.
 *
 * The one rule: the effective tier a surface renders at is
 *   effective = reducedMotion ? off : min(surface ceiling, userTier ?? surface default, capability)
 * The user's tier can only ratchet *down* from a surface's ceiling, never up.
 *
 * Promoted as-is from splicewire-app's prototype (`ui/src/_prototype/beam-ux-canvas/_fx/tiers.ts`,
 * landing-motion ticket 06 point 1).
 */
/** Tri-tier, ordered off < lite < full. */
type EffectTier = 'off' | 'lite' | 'full';
/** The three UX surface families, each with its own ceiling + default. */
type Surface = 'operate' | 'persuade' | 'experience';
/** The lower (fewer-effects) of two tiers. */
declare function minTier(a: EffectTier, b: EffectTier): EffectTier;
/** The lower of an arbitrary list of tiers (`off` if empty). */
declare function minOfTiers(tiers: EffectTier[]): EffectTier;
interface SurfaceConfig {
    /** Where the surface sits before the user touches the global toggle. */
    default: EffectTier;
    /** The highest tier the surface will ever render, however high the user toggles. */
    ceiling: EffectTier;
}
/**
 * Surface defaults + ceilings (PRD §Enablement). Operate is the precision instrument:
 * off by default, and it will never light up beyond `lite` even at user `full`.
 * Persuade/Experience are the full toy box.
 */
declare const SURFACE: Record<Surface, SurfaceConfig>;
interface ResolveInput {
    surface: Surface;
    /** The user's global toggle. `null` = untouched → use the surface default. */
    userTier: EffectTier | null;
    /** Ceiling imposed by the device/browser (`off` when no WebGL). */
    capabilityTier: EffectTier;
    /** OS/demo `prefers-reduced-motion: reduce` — a hard kill switch to `off`. */
    reducedMotion: boolean;
}
/**
 * The single resolution rule. Reduced motion (or no capability, expressed as an
 * `off` capability tier) forces `off`; otherwise clamp the effective tier to the
 * lowest of {surface ceiling, user's global tier (or surface default if untouched),
 * capability}.
 */
declare function resolveTier({ surface, userTier, capabilityTier, reducedMotion, }: ResolveInput): EffectTier;

/** A rect in the seam element's own coordinate space (CSS px, origin top-left). */
interface FxRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
type FxPointerKind = 'fine' | 'coarse' | 'none';
/** What the seam hands a scene. Live: the size and exclusions update on resize. */
interface FxSceneContext {
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
interface FxFrameInputs {
    /** The pointer relative to the seam element; `active` when within `pointerMargin` of it. */
    readonly pointer: {
        readonly x: number;
        readonly y: number;
        readonly active: boolean;
    };
    /** The host's `playing` prop (e.g. the hero's audio transport). */
    readonly playing: boolean;
}
/** A scene: brand content an effect draws. Implement these two and nothing else. */
interface FxScene {
    /** Populate `ctx.scene` and return the camera to render it with. */
    build(three: ThreeModule, ctx: FxSceneContext): THREE.Camera | Promise<THREE.Camera>;
    /**
     * Advance one frame: `t` = seconds since the loop first ran, `dt` = seconds since the previous
     * rendered frame (capped at 0.1 after a pause). The seam renders after it returns. Return
     * `false` to park the loop until `ctx.requestFrame()` (or a nearby pointer) wakes it.
     */
    frame(t: number, dt: number, inputs: FxFrameInputs): void | boolean;
}
interface FxCanvasProps {
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
declare function FxCanvas({ scene, paused, playing, exclusions, pointerMargin, rootMargin, className, style, }: FxCanvasProps): react.JSX.Element;

interface ParticleObjectProps {
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
declare function ParticleObject({ src, tint, count, animateIdle, className }: ParticleObjectProps): react.JSX.Element;

declare function canWebGl(): boolean;
/**
 * The renderer-swap upgrade point (webgl-overlay → html-in-canvas), stubbed. The HTML-in-Canvas
 * origin trial is Chrome-only + experimental and not shipped, so this is a capability-gated no-op
 * that returns `false` today. When it ships, this flips to a real feature-detect and a host's
 * renderer selection can pick `html-in-canvas` instead — no component-tree change required.
 */
declare function canHtmlInCanvas(): boolean;
/** Device/browser ceiling: `full` if WebGL is available (and not pinned off), else a hard `off`. */
declare function detectCapabilityTier(): EffectTier;
/** The lifecycle seam's late-failure sites (ticket 06 Q30). */
type FxFailureSite = 'import' | 'renderer' | 'context-lost';
/**
 * The live capability tier: probes once, then follows the late-failure pin so an already-mounted
 * boundary drops to `off` when another effect on the page fails. `off` on the server.
 */
declare function useCapabilityTier(): EffectTier;
/** One-time `prefers-reduced-motion: reduce` read, for effects that only probe on mount. */
declare function prefersReducedMotion(): boolean;
/** Live `prefers-reduced-motion: reduce`, tracked across OS changes. */
declare function usePrefersReducedMotion(): boolean;

type RendererKind = 'webgl-overlay' | 'html-in-canvas';
/**
 * Pick the compositing strategy for an effective tier. `off` → `null` (no renderer, bare
 * children). Otherwise prefer the #2 renderer when its capability is present (never today), else
 * the shippable #1 overlay. This is the entire #1→#2 upgrade surface.
 */
declare function selectRenderer(tier: EffectTier): RendererKind | null;

interface FxContextValue {
    surface: Surface;
    /** The tier actually in force here, after clamping + kill switches. */
    effectiveTier: EffectTier;
    /** Chosen compositing strategy, or `null` when `off` (bare children). */
    renderer: RendererKind | null;
    /** True when a kill switch (reduced motion / no capability) pinned us to `off`. */
    forcedOff: boolean;
    /** The user tier this boundary was given (`null` = untouched → the surface default). */
    userTier: EffectTier | null;
    /** Ask the host to change the user tier; forwards to the boundary's `onUserTierChange`. */
    setUserTier: (tier: EffectTier | null) => void;
}
interface FxBoundaryProps {
    /** UX surface family — sets the ceiling + default (`operate` is the precision instrument). */
    mode: Surface;
    /**
     * The visitor's tier, held by the host (no store in the package). `null` or absent = untouched,
     * so the surface default applies. Still clamped by the ceiling and capability, and killed by
     * reduced motion.
     */
    userTier?: EffectTier | null;
    /** Called when a descendant asks for a new user tier (`useFx().setUserTier`). */
    onUserTierChange?: (tier: EffectTier | null) => void;
    /** Demo hook: force the reduced-motion kill switch on without touching OS settings. */
    forceReducedMotion?: boolean;
    children: ReactNode;
}
declare function FxBoundary({ mode, userTier, onUserTierChange, forceReducedMotion, children }: FxBoundaryProps): react.JSX.Element;
/** Read the resolved tier/renderer. Throws if used outside an `<FxBoundary>`. */
declare function useFx(): FxContextValue;

/** Metadata for `data-fx-kind`. `noop` never renders an overlay. */
type FxKind = 'noop' | 'tint' | 'particle' | 'glass' | 'frost' | 'scene' | (string & {});
/** Where the overlay composites relative to the real DOM. */
type FxPlacement = 'under' | 'over';
interface FxEffectProps {
    /** Metadata (`data-fx-kind`); `noop` renders the children bare at every tier. */
    kind?: FxKind;
    children: ReactNode;
    /** The overlay, or a function of the resolved Fx context returning it. */
    overlay?: ReactNode | ((fx: FxContextValue) => ReactNode);
    /** `over` (default) composites on top of the children; `under` composites beneath them. */
    placement?: FxPlacement;
    /** Extra classes for the wrapper (present only when the effect is on). */
    className?: string;
}
declare function FxEffect({ kind, children, overlay, placement, className }: FxEffectProps): react.JSX.Element;

export { type EffectTier, FxBoundary, type FxBoundaryProps, FxCanvas, type FxCanvasProps, type FxContextValue, FxEffect, type FxEffectProps, type FxFailureSite, type FxFrameInputs, type FxKind, type FxPlacement, type FxPointerKind, type FxRect, type FxScene, type FxSceneContext, ParticleObject, type ParticleObjectProps, type RendererKind, type ResolveInput, SURFACE, type Surface, type SurfaceConfig, type ThreeModule, canHtmlInCanvas, canWebGl, detectCapabilityTier, loadThree, minOfTiers, minTier, prefersReducedMotion, resolveTier, selectRenderer, useCapabilityTier, useFx, usePrefersReducedMotion };
