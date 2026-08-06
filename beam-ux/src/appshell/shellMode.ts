// @splicewire/beam-ux/appshell — the AppShell mode-switch + effectiveCan core (Frame OS ticket 19).
//
// This is the GENERIC MACHINE inside splicewire-app's `AppShell` (ADR-0099): the mode axis (the host
// owns mode state and hands it to its `MainframeOutlet`, so switching swaps only the child Mainframe
// under the stable provider — a state-preserving child-swap above the router outlet) and the
// `effectiveCan` gate (the axis that decides WHICH contributions render, orthogonal to placement).
//
// The host keeps its own contribution SET (the roster of slot contributions), its `me`/manifest
// bootstrap, and its router `<Outlet/>` — none of that is generic. What travels is exactly the two
// state seams every mainframe host re-derives by hand: mode + preview-aware `can`.
import { useCallback, useMemo, useState } from 'react';
import type { MainframeCan } from '@schemastud/mainframe';
import type { Capability, ShellMode } from './types.js';

/** The window-chrome control surface the shell exposes to its contributed chrome (parity with host). */
export interface WindowChrome {
    enterWindow: () => void;
    exitWindow: () => void;
    /** Is an editor previewing the tree an unentitled visitor gets? */
    viewAsVisitor: boolean;
    setViewAsVisitor: (v: boolean) => void;
}

/** The focus-chrome control surface — peer of {@link WindowChrome} for the focus mode. */
export interface FocusChrome {
    enterFocus: () => void;
    exitFocus: () => void;
    /** Is focus mode currently active? (lets the entry affordance self-hide). */
    active: boolean;
}

export interface UseShellModeOptions {
    /**
     * The raw store predicate — the tenant's real roles/permissions. The returned `effectiveCan`
     * wraps this: normally it IS `storeCan`; while a preview (view-as-visitor) is on it additionally
     * strips the previewed-out capability.
     */
    storeCan: MainframeCan;
    /**
     * The capability stripped while "view as visitor" is on (splicewire-app's `SITE_EDIT_CAP`). When
     * omitted, view-as-visitor is inert — the gate never strips anything (a host with no preview).
     */
    previewStripCapability?: Capability;
    /** Initial mode. Defaults to `desk`. */
    initialMode?: ShellMode;
}

export interface ShellModeState {
    /** The current shell mode (host hands it to its `MainframeOutlet`). */
    mode: ShellMode;
    /** Set the mode directly (rarely needed — prefer the chrome control surfaces). */
    setMode: (mode: ShellMode) => void;
    /** The preview-aware entitlement predicate to feed the mainframe injection's `can`. */
    effectiveCan: MainframeCan;
    /** Is the view-as-visitor preview on? */
    viewAsVisitor: boolean;
    /** The window-mode control surface (enter/exit + preview toggle), identity-stable. */
    windowChrome: WindowChrome;
    /** The focus-mode control surface (enter/exit + active), identity-stable per `mode`. */
    focusChrome: FocusChrome;
}

/**
 * Derive an effective, preview-aware `can` from a base predicate. Extracted so a host can build the
 * gate imperatively (e.g. in a `useMemo`) without the full {@link useShellMode} hook. Pure.
 */
export function createEffectiveCan(
    storeCan: MainframeCan,
    viewAsVisitor: boolean,
    previewStripCapability?: Capability,
): MainframeCan {
    return (capability) => {
        if (viewAsVisitor && previewStripCapability && capability === previewStripCapability) {
            return false;
        }
        return storeCan(capability);
    };
}

/**
 * The mode-switch + effectiveCan core. Returns the mode axis, a preview-aware `can`, and the two
 * chrome control surfaces (window / focus) — the exact seams splicewire-app's `AppShell` derived by
 * hand. Leaving `window` clears the preview so `desk` is never accidentally down-gated (parity).
 */
export function useShellMode({
    storeCan,
    previewStripCapability,
    initialMode = 'desk',
}: UseShellModeOptions): ShellModeState {
    const [mode, setMode] = useState<ShellMode>(initialMode);
    const [viewAsVisitor, setViewAsVisitor] = useState(false);

    const effectiveCan = useCallback<MainframeCan>(
        (capability) => createEffectiveCan(storeCan, viewAsVisitor, previewStripCapability)(capability),
        [storeCan, viewAsVisitor, previewStripCapability],
    );

    const windowChrome = useMemo<WindowChrome>(
        () => ({
            enterWindow: () => setMode('window'),
            exitWindow: () => {
                setViewAsVisitor(false);
                setMode('desk');
            },
            viewAsVisitor,
            setViewAsVisitor,
        }),
        [viewAsVisitor],
    );

    const focusChrome = useMemo<FocusChrome>(
        () => ({
            enterFocus: () => setMode('focus'),
            exitFocus: () => setMode('desk'),
            active: mode === 'focus',
        }),
        [mode],
    );

    return { mode, setMode, effectiveCan, viewAsVisitor, windowChrome, focusChrome };
}
