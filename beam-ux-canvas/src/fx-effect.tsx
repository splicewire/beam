/**
 * The declarative decorator that embodies the load-bearing doctrine: **effects decorate the DOM,
 * they never replace it.** `children` are ALWAYS the real, shippable DOM — the source of truth. The
 * effect is a `pointer-events: none` overlay layered over or under them, and *only* when the tier is
 * on.
 *
 * The doctrine falls out of the branches below:
 *   • outside an `<FxBoundary>` → `<>{children}</>`: bare. An effect never lights itself up.
 *   • effective `off` (or `kind="noop"`, no renderer, or no overlay) → `<>{children}</>`: bare, no
 *     wrapper at all, so it renders byte-identically to having no `<FxEffect>` around it.
 *   • tier on → a positioned, isolated wrapper carrying `data-fx-tier`, holding the SAME `children`
 *     plus one absolutely positioned overlay layer: before the children and composited beneath them
 *     for `placement="under"` (a backdrop behind a headline), after them and on top for `"over"`.
 *
 * Each use supplies its overlay (a `<FxCanvas>` scene, a `<ParticleObject>`, …) via `overlay`, given
 * the resolved Fx context so it can adapt to `lite`/`full`.
 *
 * Promoted from splicewire-app's prototype (`ui/src/_prototype/beam-ux-canvas/_fx/FxEffect.tsx`). The
 * prototype's built-in `tint` overlay stays in the prototype (it is flagship content).
 */
import { useContext, type CSSProperties, type ReactNode } from 'react';
import { FxContext, type FxContextValue } from './fx-boundary';

/** Metadata for `data-fx-kind`. `noop` never renders an overlay. */
export type FxKind = 'noop' | 'tint' | 'particle' | 'glass' | 'frost' | 'scene' | (string & {});

/** Where the overlay composites relative to the real DOM. */
export type FxPlacement = 'under' | 'over';

export interface FxEffectProps {
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

const WRAPPER_STYLE: CSSProperties = { position: 'relative', isolation: 'isolate' };
const LAYER_STYLE: Record<FxPlacement, CSSProperties> = {
    // A negative z-index inside the wrapper's own stacking context (isolation) paints above the
    // wrapper's background and beneath its in-flow children.
    under: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1 },
    over: { position: 'absolute', inset: 0, pointerEvents: 'none' },
};

export function FxEffect({ kind, children, overlay, placement = 'over', className }: FxEffectProps) {
    const fx = useContext(FxContext);

    // Decorate-never-replace: outside a boundary, at off, for noop, or with no renderer → bare.
    if (!fx || fx.effectiveTier === 'off' || fx.renderer === null || kind === 'noop') {
        return <>{children}</>;
    }

    const overlayNode = typeof overlay === 'function' ? overlay(fx) : overlay;
    // Nothing to composite → still bare, so we never introduce a wrapper for no reason.
    if (overlayNode == null || overlayNode === false) return <>{children}</>;

    const layer = (
        <div data-fx-overlay={placement} aria-hidden="true" style={LAYER_STYLE[placement]}>
            {overlayNode}
        </div>
    );

    return (
        <div
            className={className}
            style={WRAPPER_STYLE}
            data-fx-kind={kind}
            data-fx-tier={fx.effectiveTier}
            data-fx-renderer={fx.renderer}
            data-fx-placement={placement}
        >
            {placement === 'under' && layer}
            {children}
            {placement === 'over' && layer}
        </div>
    );
}
