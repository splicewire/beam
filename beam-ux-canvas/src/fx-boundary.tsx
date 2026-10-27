/**
 * The provider that resolves the effective effects tier for a subtree and picks a renderer
 * strategy. It is the ONE place the inputs meet:
 *
 *   effective = reducedMotion ? off : min(surface ceiling, userTier ?? surface default, capability)
 *
 * `<FxEffect>` and `<FxCanvas>` descendants read the resolved tier + renderer from context; they
 * never re-derive it. A CSS island that has no overlay reads `useFx().effectiveTier` and sets its
 * own `data-fx-tier` — the boundary renders only a context provider, never a wrapper element.
 *
 * **No store.** The visitor's preference is the host's: it passes `userTier` as a prop and hears
 * changes through `onUserTierChange`; a descendant control writes with `useFx().setUserTier`
 * (landing-motion tickets 04 and 06 Q11). The package ships no `zustand` and persists nothing.
 *
 * Promoted from splicewire-app's prototype (`ui/src/_prototype/beam-ux-canvas/_fx/FxBoundary.tsx`),
 * with the prototype's global store replaced by the prop/callback pair.
 */
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useCapabilityTier, usePrefersReducedMotion } from './capability';
import { selectRenderer, type RendererKind } from './renderers';
import { resolveTier, type EffectTier, type Surface } from './tiers';

export interface FxContextValue {
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

/** @internal Read by `FxEffect` and `FxCanvas`, which also work outside a boundary. */
export const FxContext = createContext<FxContextValue | null>(null);

export interface FxBoundaryProps {
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

export function FxBoundary({ mode, userTier = null, onUserTierChange, forceReducedMotion = false, children }: FxBoundaryProps) {
    const osReducedMotion = usePrefersReducedMotion();
    const reducedMotion = osReducedMotion || forceReducedMotion;
    const capabilityTier = useCapabilityTier();

    const onChange = useRef(onUserTierChange);
    onChange.current = onUserTierChange;
    const setUserTier = useCallback((tier: EffectTier | null) => onChange.current?.(tier), []);

    const value = useMemo<FxContextValue>(() => {
        const effectiveTier = resolveTier({ surface: mode, userTier, capabilityTier, reducedMotion });
        return {
            surface: mode,
            effectiveTier,
            renderer: selectRenderer(effectiveTier),
            forcedOff: effectiveTier === 'off' && (reducedMotion || capabilityTier === 'off'),
            userTier,
            setUserTier,
        };
    }, [mode, userTier, capabilityTier, reducedMotion, setUserTier]);

    return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

/** Read the resolved tier/renderer. Throws if used outside an `<FxBoundary>`. */
export function useFx(): FxContextValue {
    const ctx = useContext(FxContext);
    if (!ctx) throw new Error('useFx must be used within an <FxBoundary>');
    return ctx;
}
