/**
 * The **Mainframe host-shell factory** — the OOTB layer above the ticket-03 seam.
 *
 * The seam (`react.tsx`) ships the delegation machinery: a host builds the registry pair, registers
 * modes, and drops a `<MainframeOutlet>`. But EVERY beam site re-implements the *same* host wiring —
 * the registry construction, the `domain`/`window` mode components, the mode state, the entry-body
 * load, the `can` gate, the `?beam_entry` override, the kind-aware `main` fork. splicewire-app's
 * `DocsHost` and audiostud's `mainframe-host.tsx` were byte-for-byte the same 380-line shape.
 *
 * `createMainframeHost(config)` promotes that shape here. A host now writes ~15 lines of config — the
 * component→entry map, its ribbon chrome, and the three renderers (Puck editor / read / inspector,
 * kept host-local because they carry the heavy author-only deps) — and gets the framed layout.
 *
 * **Topology:** this module stays dependency-pure (react-only). It does NOT import `@splicewire/beam-ux`
 * for entry loading — the host *injects* `loadEntryBody` (routing it through beam-ux's `UxBuilderClient`
 * on its side), so no `beam-mainframe → beam-ux` edge is introduced and the factory stays generic.
 */
import type { ReactNode } from 'react';
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
    createMainframeRegistry,
    type MainframeRegistry,
    type MainframeProps,
    createSlotRegistry,
    type SlotRegistry,
    MainframeProvider,
    MainframeOutlet,
    type MainframeInjection,
    type MainframeCan,
} from '@schemastud/mainframe';

// --- Kind test ---------------------------------------------------------------------------------

/**
 * The single kind test shared by the read + author forks: a **Puck Data** body is `{content:[…]}`
 * (an array), distinct from a **chrome-only** page body whose `content` is a string. The `main` fork
 * offers the structural Puck canvas only for a Puck body; a chrome-only body edits in place.
 */
export function isPuckBody(body: unknown): boolean {
    return !!body && typeof body === 'object' && Array.isArray((body as { content?: unknown }).content);
}

// --- The entry a reshelled page reads its chrome through ----------------------------------------

/**
 * The loaded `page` entry as the host projects it (beam-ux `entries.body.show`). `composable` is the
 * ticket-14 editability tier (F06): structural Puck editing is offered only when it is not `false`.
 * Backwards-compatible — an older projection that omits it is treated as composable.
 */
export interface HostEntryBody {
    slug: string;
    schema: Record<string, unknown> | null;
    body: unknown;
    composable?: boolean;
}

/** The `{slug, schema, body}` a wrapped page reads via {@link useBeamUxEntry}. `body` is host-typed. */
export interface BeamUxEntryContext<TBody = Record<string, unknown>> {
    slug: string;
    schema: Record<string, unknown> | null;
    body: TBody;
}

const BeamUxEntryCtx = createContext<BeamUxEntryContext<Record<string, unknown>> | null>(null);

/**
 * The one seam a reshelled beam-ux page reads its own chrome through. Returns the loaded `page` entry
 * — `{slug, schema, body}` — or `null` until the host's body load resolves (the page falls back to its
 * own copy meanwhile; the entry is the source of truth, never a hard dep). A host typically re-exports
 * a body-typed alias so its pages read `entry.body.heading` etc. with types.
 */
export function useBeamUxEntry<TBody = Record<string, unknown>>(): BeamUxEntryContext<TBody> | null {
    return useContext(BeamUxEntryCtx) as BeamUxEntryContext<TBody> | null;
}

// --- The mode payload (internal) ---------------------------------------------------------------

interface DomainPayload {
    page: ReactNode;
    entrySlug: string;
    entryBound: boolean;
    canAuthor: boolean;
    authoring: boolean;
    entryBodyRaw: unknown;
    composable: boolean;
    onEdit: () => void;
    onExit: () => void;
    config: MainframeHostConfig;
    ribbon: RibbonRender;
}

// --- Config ------------------------------------------------------------------------------------

/**
 * The props the host's ribbon render-prop receives — the status/toolbar chrome is host-owned. The
 * ribbon renders only for an author (a reader never sees it), so no `canAuthor` is threaded through.
 */
export interface RibbonProps {
    mode: 'domain' | 'window';
    entrySlug: string;
    entryBound: boolean;
    onEdit: () => void;
    onExit: () => void;
}

export type RibbonRender = (props: RibbonProps) => ReactNode;

/** The page context a host reads off Inertia (`usePage`) — kept behind a function so inertia stays out. */
export interface HostPageContext {
    component: string;
    canAuthor: boolean;
    slug?: string | null;
}

export interface MainframeHostConfig {
    /**
     * Inertia component name → beam-ux `page` entry slug. The entry slug is the DOMAIN key (the P3
     * ParticleResource / the git-authored page), which is not always the slash-swapped component path
     * (`songs/index`→`songs`). A component with no mapping falls back to the slash-swap.
     */
    componentToEntry?: Record<string, string>;
    /** The author-gate capability fed to the `can` predicate. Defaults to `author-ux`. */
    capability?: string;
    /** Host wraps Inertia `usePage` → `{component, canAuthor, slug?}` (keeps inertia out of the package). */
    usePageContext: () => HostPageContext;
    /** Host-injected transport — routes through beam-ux's `UxBuilderClient`; `null` on miss (page falls back). */
    loadEntryBody: (slug: string) => Promise<HostEntryBody | null>;
    /** The structural Puck editor mount (host-local; carries the heavy author-only deps). */
    renderEditor: (args: { slug: string }) => ReactNode;
    /** The composed read render for a Puck body (host-local). */
    renderRead: (args: { body: unknown; slug: string }) => ReactNode;
    /** The in-place RegionInspector overlay for a chrome-only body (host-local). */
    renderInspector: (args: { slug: string }) => ReactNode;
    /** The frame ribbon chrome. Optional — a host with none gets the {@link defaultRibbon} shell. */
    ribbon?: RibbonRender;
    /**
     * Bottom space (px) reserved under `window` (author) mode so a fixed bottom ribbon never clips
     * content. Defaults to 28 (the {@link defaultRibbon} height). A host with a taller ribbon sets its
     * own — the package can't know an injected ribbon's height, so this is the one dimension it exposes.
     */
    ribbonReserve?: number;
}

// --- OOTB ribbon (default shell) ---------------------------------------------------------------

const DEFAULT_BAR: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 28,
    padding: '0 12px',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    color: '#fff',
    background: '#17120E',
    borderTop: '1px solid rgba(255,91,58,.4)',
};

const DEFAULT_BTN: React.CSSProperties = {
    marginLeft: 'auto',
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid rgba(255,91,58,.5)',
    color: '#FF5B3A',
    borderRadius: 4,
    padding: '1px 8px',
    fontSize: 11,
    fontFamily: 'inherit',
};

/**
 * The OOTB frame ribbon a host gets when it injects no `ribbon`. A bottom status bar with the mode +
 * entry + the read↔author toggle. A host with a design system passes its own render-prop to override.
 */
export const defaultRibbon: RibbonRender = ({ mode, entrySlug, entryBound, onEdit, onExit }) => (
    <div data-beam-ux-frame={entrySlug} data-beam-ux-mode={mode} style={DEFAULT_BAR}>
        <span style={{ color: '#FF5B3A' }}>beam-ux</span>
        <span style={{ opacity: 0.6 }}>{mode === 'window' ? 'editing' : 'page'} · {entrySlug}</span>
        {mode === 'domain' ? (
            <>
                <span style={{ opacity: 0.8 }}>entry {entryBound ? 'bound ✓' : '…'}</span>
                {entryBound && (
                    <button type="button" style={DEFAULT_BTN} onClick={onEdit} data-beam-ux-edit>
                        Edit page
                    </button>
                )}
            </>
        ) : (
            <button type="button" style={DEFAULT_BTN} onClick={onExit} data-beam-ux-exit>
                Exit
            </button>
        )}
    </div>
);

// --- OOTB mode components ----------------------------------------------------------------------

/**
 * `domain` (read) mode. A reader (guest or any non-author) sees just the page — the ribbon is an
 * authoring-only affordance. Only an author gets the ribbon + the "Edit page" toggle over the page.
 */
export function DomainMainframe({ slots, ctx }: MainframeProps) {
    const p = ctx.payload as DomainPayload;

    if (!p.canAuthor) {
        return <>{slots.main(ctx.payload)}</>;
    }

    return (
        <>
            {p.ribbon({
                mode: 'domain',
                entrySlug: p.entrySlug,
                entryBound: p.entryBound,
                onEdit: p.onEdit,
                onExit: p.onExit,
            })}
            {slots.main(ctx.payload)}
        </>
    );
}

/**
 * `window` (author WYSIWYG) mode — the ribbon FRAMES the in-place surface in `main`: the real page
 * with the RegionInspector docked over it (chrome-only bodies) or the Puck editor (Puck bodies).
 */
export function WindowMainframe({ slots, ctx }: MainframeProps) {
    const p = ctx.payload as DomainPayload;
    const reserve = p.config.ribbonReserve ?? 28;

    return (
        <>
            {p.ribbon({
                mode: 'window',
                entrySlug: p.entrySlug,
                entryBound: p.entryBound,
                onEdit: p.onEdit,
                onExit: p.onExit,
            })}
            <div style={{ paddingBottom: reserve }}>{slots.main(ctx.payload)}</div>
        </>
    );
}

// --- Entry-slug resolution ---------------------------------------------------------------------

function entrySlugFor(component: string, map: Record<string, string>): string {
    return map[component] ?? component.replace(/\//g, '-');
}

/**
 * The authoring OVERRIDE seam: `?beam_entry=<slug>` on any authored route loads THAT entry into the
 * window-mode editor instead of the route's own entry — the cheapest way to author a slot-bearing
 * template before a dedicated admin index exists. Absent the param, resolution is unchanged.
 */
function overrideEntrySlug(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const slug = new URLSearchParams(window.location.search).get('beam_entry');

    return slug && slug.trim() !== '' ? slug.trim() : null;
}

// --- The read fork -----------------------------------------------------------------------------

/** Read view: the composed Puck render for a Puck body, else the wrapped Inertia page (never blank). */
function PuckReadOrPage({ payload }: { payload: DomainPayload }) {
    const body = payload.entryBodyRaw;

    if (!isPuckBody(body)) {
        return <>{payload.page}</>;
    }

    // The read renderer is a lazy (heavy Puck) mount; while its chunk loads the reader keeps seeing the
    // live Inertia page — the fallback is the page, not blank. Only the fork knows the page, so the
    // Suspense lives here (the host's `renderEditor`/`renderInspector` own their own author-chrome fallbacks).
    return (
        <Suspense fallback={<>{payload.page}</>}>{payload.config.renderRead({ body, slug: payload.entrySlug })}</Suspense>
    );
}

// --- The factory -------------------------------------------------------------------------------

/**
 * Build the Inertia Mainframe host layout from host config. Returns a component that FRAMES the page
 * (`children`) in a Mainframe with the two modes:
 *
 *   - `domain` (read) — the page renders as the `main` payload, bound to its `page` entry.
 *   - `window` (author) — for an author with the `capability` ability, `main` swaps to the kind-aware
 *     editor (Puck canvas for a composable Puck body, else the in-place inspector).
 *
 * Mode-switch is a child-swap under the stable provider (ADR-0099) — no remount, so the toggle is
 * smooth. The entitlement is fed to the `can` predicate; a non-author never sees the toggle or editor.
 */
export function createMainframeHost(config: MainframeHostConfig) {
    const capability = config.capability ?? 'author-ux';
    const componentToEntry = config.componentToEntry ?? {};
    const ribbon = config.ribbon ?? defaultRibbon;

    return function MainframeHost({ children }: { children: ReactNode }) {
        const { component, canAuthor, slug } = config.usePageContext();

        // A `beam-page` component carries its entry key as an explicit `slug` prop (its component NAME
        // is `beam-page` for every such page, so the name→slug map can't distinguish them). Prefer it.
        const propSlug = typeof slug === 'string' && slug !== '' ? slug : null;

        const entrySlug = useMemo(
            () => overrideEntrySlug() ?? propSlug ?? entrySlugFor(component, componentToEntry),
            [component, propSlug],
        );
        const [entry, setEntry] = useState<HostEntryBody | null>(null);
        const [mode, setMode] = useState<'domain' | 'window'>('domain');

        useEffect(() => {
            let live = true;
            void config.loadEntryBody(entrySlug).then((e) => live && setEntry(e));

            return () => {
                live = false;
            };
        }, [entrySlug]);

        // Registries built once; the page + live state ride ctx.payload each render.
        const registries = useMemo<{ slots: SlotRegistry; mainframes: MainframeRegistry }>(() => {
            const slots = createSlotRegistry();
            const mainframes = createMainframeRegistry();

            mainframes.register('domain', DomainMainframe);
            mainframes.register('window', WindowMainframe);

            // `main` render-slot: the editor while authoring (window + author), else the page.
            slots.contribute({
                slot: 'main',
                key: 'domain.main',
                render: (payload) => {
                    const p = payload as DomainPayload;

                    // Authoring is kind-aware (no blind Puck swap):
                    //   - composable Puck body → the Puck composed-page editor.
                    //   - chrome-only body     → the real page in place + the RegionInspector over it.
                    //   - no editable body     → fall through to the page, never a blank editor.
                    if (p.authoring) {
                        // Structural (Puck) editing requires BOTH a Puck body AND `composable` (F06) —
                        // a non-composable behavior-realm entry is sealed even if it carried a Puck body.
                        if (p.composable && isPuckBody(p.entryBodyRaw)) {
                            return <>{p.config.renderEditor({ slug: p.entrySlug })}</>;
                        }

                        if (p.entryBound) {
                            return (
                                <>
                                    {p.page}
                                    {p.config.renderInspector({ slug: p.entrySlug })}
                                </>
                            );
                        }

                        return <>{p.page}</>;
                    }

                    return <PuckReadOrPage payload={p} />;
                },
            });

            return { slots, mainframes };
        }, []);

        // The entitlement predicate — the `capability`-gated slot resolves only for an author.
        const can = useCallback<MainframeCan>((cap) => (cap === capability ? canAuthor : true), [canAuthor]);

        const injection = useMemo<MainframeInjection>(() => ({ ...registries, can }), [registries, can]);

        const entryContext = useMemo<BeamUxEntryContext<Record<string, unknown>> | null>(
            () =>
                entry === null
                    ? null
                    : { slug: entry.slug, schema: entry.schema, body: (entry.body ?? {}) as Record<string, unknown> },
            [entry],
        );

        const authoring = mode === 'window' && canAuthor;

        const payload: DomainPayload = {
            page: children,
            entrySlug,
            entryBound: entry !== null,
            canAuthor,
            authoring,
            entryBodyRaw: entry?.body ?? null,
            // Composable unless the projection explicitly declares `false`; an unbound entry is treated
            // as non-composable (nothing to structurally edit until the body is known).
            composable: entry?.composable !== false && entry !== null,
            onEdit: () => setMode('window'),
            onExit: () => setMode('domain'),
            config,
            ribbon,
        };

        return (
            <BeamUxEntryCtx.Provider value={entryContext}>
                <MainframeProvider injection={injection}>
                    <MainframeOutlet mode={mode} ctx={{ payload }} />
                </MainframeProvider>
            </BeamUxEntryCtx.Provider>
        );
    };
}
