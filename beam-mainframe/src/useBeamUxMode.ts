/**
 * `useBeamUxMode()` — the READ side of the `beam-ux:mode` broadcast this package EMITS.
 *
 * `createMainframeHost` (host.tsx) dispatches a `beam-ux:mode` CustomEvent whenever the authoring
 * mode, the page's editability, or the current entry ref changes — so an external control (a Frame OS
 * operator dock, a toolbar, a keyboard shortcut layer) can label its "Edit this page" affordance
 * without the Mainframe having to know it exists. Until now every such control hand-rolled the same
 * eight-line `addEventListener('beam-ux:mode', …)` effect, which is why three copies of one operator
 * desk each carried a private transcription of a contract that has exactly one emitter.
 *
 * The emitter and the listener belong in the same package: rename a detail field here and both halves
 * move together. A `CustomEvent` detail is untyped on the wire, so this hook is the only place the
 * shape is written down as a type — a consumer that reads `event.detail` by hand gets no such check.
 *
 * The broadcast is EDGE-triggered (it fires on change, not on subscribe), so a control that mounts
 * after the Mainframe has settled sees `mode: null` until the next change. That is deliberate and
 * matches what every hand-rolled copy already did: the dock's Edit affordance stays disabled until the
 * page tells it otherwise, which is the safe direction to be wrong in.
 */
import { useEffect, useState } from 'react';

/** The authoring modes `createMainframeHost` registers. `window` is the in-place editor. */
export type BeamUxMode = 'domain' | 'window';

/** The `beam-ux:mode` detail, as a type. Mirrors the dispatch in host.tsx. */
export interface BeamUxModeState {
    /** The live authoring mode, or `null` before the first broadcast is heard. */
    mode: BeamUxMode | null;
    /** Sugar for `mode === 'window'` — the in-place content editor is open. */
    editing: boolean;
    /** Whether the current page can be authored at all (author entitlement AND a resolved entry). */
    editable: boolean;
    /** The current entry's slug, for a control that opens a per-page surface keyed on it. */
    slug: string | null;
    /** The current entry's id. ADDITIVE beside `slug` (see the dispatch docblock in host.tsx). */
    entryId: string | number | null;
}

const INITIAL: BeamUxModeState = {
    mode: null,
    editing: false,
    editable: false,
    slug: null,
    entryId: null,
};

/**
 * Subscribe to the page Mainframe's `beam-ux:mode` broadcast.
 *
 * SSR-safe: the effect never runs on the server, and the initial state is the "know nothing yet"
 * reading rather than an optimistic one.
 */
export function useBeamUxMode(): BeamUxModeState {
    const [state, setState] = useState<BeamUxModeState>(INITIAL);

    useEffect(() => {
        const onMode = (e: Event) => {
            const d =
                (
                    e as CustomEvent<{
                        mode?: string;
                        editable?: boolean;
                        slug?: string | null;
                        entryId?: string | number | null;
                    }>
                ).detail ?? {};

            setState({
                mode: d.mode === 'window' || d.mode === 'domain' ? d.mode : null,
                editing: d.mode === 'window',
                editable: !!d.editable,
                slug: d.slug ?? null,
                entryId: d.entryId ?? null,
            });
        };

        window.addEventListener('beam-ux:mode', onMode);

        return () => window.removeEventListener('beam-ux:mode', onMode);
    }, []);

    return state;
}

/** Ask the page Mainframe to ENTER the in-place editor. The write side of the same contract. */
export function requestBeamUxEdit(): void {
    window.dispatchEvent(new CustomEvent('beam-ux:edit'));
}

/** Ask the page Mainframe to LEAVE the in-place editor. */
export function requestBeamUxExit(): void {
    window.dispatchEvent(new CustomEvent('beam-ux:exit'));
}
