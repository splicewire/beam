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
 *
 * **It is also the thing that DECIDES THE ADDRESS**, which is why beam-docs-satellite ticket 37 found it
 * only by executing a migration rather than by grepping for `UxBuilderClient` (this package does not
 * implement that interface; it sits above it). Everything the host's transport can do is bounded by the
 * key this factory hands it, so ADR-0214's id-addressed entry-body operations could not reach a single
 * host until that key stopped being a bare slug. See {@link EntryRef}.
 */
import type { ReactNode } from 'react';
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

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
 * The loaded `page` entry as the host projects it (beam-ux `entries.body.show`). `id` is the entry's
 * uuid (the `Route::recordVersions()` addressing key, `/beam-ux/entries/{id}/versions`) — optional
 * since a host's `loadEntryBody` may project a narrower shape; present whenever the underlying
 * `BeamUxEntryBodyData` envelope carries it (it always does).
 */
export interface HostEntryBody {
    slug: string;
    id?: string;
    schema: Record<string, unknown> | null;
    body: unknown;
}

// --- The entry REFERENCE (the addressing key this factory hands the host) -------------------------

/**
 * **How the Mainframe addresses the entry a page is bound to** — `{id, slug}`, both nullable, at least
 * one always populated.
 *
 * This used to be a bare `string`, and that string was a SLUG in every branch. beam-docs-satellite
 * ticket 37 is the measurement that ended it: `@splicewire/beam-mainframe` sits ABOVE `UxBuilderClient`
 * and decides the address, so ADR-0214's move to id-addressed entry-body operations could not land at
 * any host while this factory could only ever produce a slug.
 *
 * ### Why a pair and not just an id
 *
 * ADR-0214 §2 says "the renderer already puts the entry id in its props", and it does — for RENDERED
 * entries. Measured, that is one branch of three, and the other two cannot carry an id:
 *
 *  - `?beam_entry=<slug>` is typed by a HUMAN. Nobody types a uuid.
 *  - `componentToEntry` is a host-authored, COMPILE-TIME frontend map. `{'customers': 'customers-page'}`
 *    is authorable; `{'customers': '01a001bc-…'}` is not — a uuid differs in every database the app is
 *    deployed into, including a fresh install.
 *  - and at `rushing/audiostud` the slug branch has a permanent resident besides: AUTO-PROVISIONING.
 *    A page whose entry does not exist yet is authored BY SLUG, because there is no row to hold an id.
 *
 * So the honest shape is a pair, with the id preferred wherever it exists. A host that has migrated
 * (every page a rendered entry carrying `props.entry.id`) simply never sees `id: null` and can refuse
 * a slug-only ref outright — which is exactly what `splicewire/www` now does.
 *
 * ### Why this is a TYPE change and not a rename
 *
 * The same trap ticket 33 recorded: a slug and an id are both `string`, so a slug flowing into an
 * id-addressed seam is invisible to `tsc`. It is not hypothetical — measured 2026-08-26, all three
 * starters (`laravel-beam-starter`, `-satellite-`, `-tower-`) declare `bodyClient: UxBuilderClient`
 * and call `loadBody(slug)` against the slug macro, and the compiler has never once complained.
 * Widening `loadEntryBody`'s parameter from `string` to `EntryRef` breaks every such call site LOUDLY
 * (parameter contravariance under `strictFunctionTypes`), which is the only reason the migration is
 * reviewable at all.
 */
export interface EntryRef {
    /** The entry's uuid — the ADR-0214 §2 addressing key — when the host could supply one, else null. */
    id: string | null;
    /** The domain slug, when known. Null only on an id-only ref (`?beam_entry_id=`). */
    slug: string | null;
}

/** Display label for a ref — the slug when there is one, else the id. Never blank for a real ref. */
export function entryRefLabel(ref: EntryRef | null): string {
    return ref?.slug ?? ref?.id ?? '—';
}

/** The `{slug, id, schema, body}` a wrapped page reads via {@link useBeamUxEntry}. `body` is host-typed. */
export interface BeamUxEntryContext<TBody = Record<string, unknown>> {
    slug: string;
    id?: string;
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
    /** Null when NO branch produced a key — the page is simply not entry-bound and nothing is probed. */
    entryRef: EntryRef | null;
    entryBound: boolean;
    canAuthor: boolean;
    authoring: boolean;
    entryBodyRaw: unknown;
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
    /** The addressed entry, or null when this page is bound to none. See {@link entryRefLabel}. */
    entryRef: EntryRef | null;
    entryBound: boolean;
    onEdit: () => void;
    onExit: () => void;
}

export type RibbonRender = (props: RibbonProps) => ReactNode;

/** The page context a host reads off Inertia (`usePage`) — kept behind a function so inertia stays out. */
export interface HostPageContext {
    component: string;
    canAuthor: boolean;
    /** The entry SLUG off the page's props (`props.entry.slug`, or a host's own explicit `props.slug`). */
    slug?: string | null;
    /**
     * The entry's **uuid** off the page's props (`props.entry.id`, emitted by `PublicEntryController`
     * since ADR-0209 §6). Supply it and this page addresses by id — the branch ADR-0214 §2 describes.
     *
     * This one is deliberately additive/optional rather than forced, because it is the branch a host
     * MIGRATES INTO: a host that does not supply it keeps working on `slug`, exactly as before, and its
     * remaining work is visible as a missing `entryId` rather than as a break. The forcing happens one
     * level down, on {@link MainframeHostConfig.loadEntryBody}, whose parameter type changed.
     */
    entryId?: string | null;
}

export interface MainframeHostConfig {
    /**
     * Inertia component name → beam-ux `page` entry slug. The entry slug is the DOMAIN key (the P3
     * ParticleResource / the git-authored page), which is not always the slash-swapped component path
     * (`songs/index`→`songs`). A component with no mapping falls back to the slash-swap.
     */
    componentToEntry?: Record<string, string>;
    /**
     * Whether an UNMAPPED component may still fall back to the slash-swapped component name
     * (`songs/index` → `songs-index`). **Defaults to `false`**, which is a change: it used to be
     * unconditional, and unconditional is what produced the defect ADR-0214 §2 names.
     *
     * Measured: every rendered entry is the Inertia component `site/entry`, so every one of them
     * slash-swapped to `site-entry` and probed a row that has never existed — a stray 401 per anonymous
     * page view, and the WRONG row for an author. Worse at a host with auto-provisioning
     * (`rushing/audiostud`), where an author merely VISITING such a page mints a junk entry named after
     * a component.
     *
     * With no fallback and no mapping, {@link createMainframeHost} resolves NO ref and loads nothing —
     * the page is simply not entry-bound, which is the truth. A host that genuinely wants the old
     * name-guessing behaviour opts back into it here, in one visible line.
     */
    componentSlugFallback?: boolean;
    /** The author-gate capability fed to the `can` predicate. Defaults to `author-ux`. */
    capability?: string;
    /**
     * READ-mode rendering strategy:
     *  - `'body'` (default) — the factory renders the entry's Puck body via `renderRead` (for pages that
     *    are bare shells bound to an entry).
     *  - `'page'` — render the real Inertia page (`payload.page`) unchanged; the PAGE renders its own body
     *    (its own SiteLayout chrome + scoped CSS + PuckPageRender). Use this when pages are NOT shells —
     *    otherwise the read-swap strips the page's chrome/CSS. Author (`window`) mode is unaffected.
     */
    readMode?: 'body' | 'page';
    /** Host wraps Inertia `usePage` → `{component, canAuthor, slug?}` (keeps inertia out of the package). */
    usePageContext: () => HostPageContext;
    /**
     * Host-injected transport — `null` on miss (the page falls back to its own copy).
     *
     * Takes an {@link EntryRef}, not a slug. A host on the id-addressed `beam-ux-entry` operations
     * (ADR-0214 §1) reads `ref.id` and REFUSES a slug-only ref; a host still on the slug macro reads
     * `ref.slug`. Both are legal, and the type is what makes which one a host is on legible.
     */
    loadEntryBody: (ref: EntryRef) => Promise<HostEntryBody | null>;
    /** The structural Puck editor mount (host-local; carries the heavy author-only deps). */
    renderEditor: (args: { ref: EntryRef }) => ReactNode;
    /** The composed read render for a Puck body (host-local). */
    renderRead: (args: { body: unknown; ref: EntryRef }) => ReactNode;
    /** The in-place RegionInspector overlay for a chrome-only body (host-local). */
    renderInspector: (args: { ref: EntryRef }) => ReactNode;
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
export const defaultRibbon: RibbonRender = ({ mode, entryRef, entryBound, onEdit, onExit }) => (
    <div data-beam-ux-frame={entryRefLabel(entryRef)} data-beam-ux-mode={mode} style={DEFAULT_BAR}>
        <span style={{ color: '#FF5B3A' }}>beam-ux</span>
        <span style={{ opacity: 0.6 }}>{mode === 'window' ? 'editing' : 'page'} · {entryRefLabel(entryRef)}</span>
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
                entryRef: p.entryRef,
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
                entryRef: p.entryRef,
                entryBound: p.entryBound,
                onEdit: p.onEdit,
                onExit: p.onExit,
            })}
            <div style={{ paddingBottom: reserve }}>{slots.main(ctx.payload)}</div>
        </>
    );
}

// --- Entry-ref resolution ------------------------------------------------------------------------

/** Trim to a non-empty string, or null. The one place blank-vs-absent is normalised. */
function nonEmpty(value: string | null | undefined): string | null {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    return trimmed === '' ? null : trimmed;
}

/**
 * The COMPONENT-NAME branch — the third and last, and the one that cannot ever carry an id.
 *
 * An explicit `componentToEntry` mapping always wins. Absent a mapping, the slash-swapped component
 * name is used ONLY when the host has opted into it ({@link MainframeHostConfig.componentSlugFallback}),
 * because guessing produced the `site-entry` probe defect ADR-0214 §2 names. No mapping and no opt-in
 * ⇒ **null**: this page is bound to no entry, and nothing is fetched.
 */
function componentEntryRef(component: string, map: Record<string, string>, guess: boolean): EntryRef | null {
    const mapped = nonEmpty(map[component]);

    if (mapped !== null) {
        return { id: null, slug: mapped };
    }

    return guess ? { id: null, slug: component.replace(/\//g, '-') } : null;
}

/**
 * The authoring OVERRIDE seam: `?beam_entry=<slug>` (or `?beam_entry_id=<uuid>`) on any authored route
 * loads THAT entry into the window-mode editor instead of the route's own — the cheapest way to author
 * a slot-bearing template before a dedicated admin index exists. Absent both params, resolution is
 * unchanged.
 *
 * `beam_entry_id` is the id-addressed twin, added with {@link EntryRef}: an author copies a uuid out of
 * the entries admin. `beam_entry` stays because a human typing a KEY types a slug, and a host still on
 * the slug transport (or one that auto-provisions) can serve it. A host that has retired slug
 * addressing simply returns null from `loadEntryBody` for a slug-only ref — the override then does
 * nothing, loudly and locally, rather than silently addressing the wrong row.
 */
function overrideEntryRef(): EntryRef | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const params = new URLSearchParams(window.location.search);
    const id = nonEmpty(params.get('beam_entry_id'));

    if (id !== null) {
        return { id, slug: null };
    }

    const slug = nonEmpty(params.get('beam_entry'));

    return slug === null ? null : { id: null, slug };
}

// --- The read fork -----------------------------------------------------------------------------

// True once hydrated; false on the server AND the first client render (so SSR HTML and the first client
// render agree). Puck's read renderer isn't SSR-safe — it adds client-only drag/interaction attributes —
// so we render the plain Inertia page for SSR + first paint, then swap to the Puck render after hydration.
const subscribeHydrated = () => () => {};
function useHydrated(): boolean {
    return useSyncExternalStore(subscribeHydrated, () => true, () => false);
}

/** Read view: the composed Puck render for a Puck body, else the wrapped Inertia page (never blank). */
function PuckReadOrPage({ payload }: { payload: DomainPayload }) {
    const hydrated = useHydrated();
    const body = payload.entryBodyRaw;

    // `readMode: 'page'` — the page renders its OWN body (chrome + scoped CSS + its own PuckPageRender);
    // never swap it for the bare entry body (which would strip its SiteLayout/nav/CSS).
    if (payload.config.readMode === 'page') {
        return <>{payload.page}</>;
    }

    // SSR + first client render → the plain page (SSR-safe, hydrates cleanly). Puck read is client-only.
    if (!hydrated || !isPuckBody(body)) {
        return <>{payload.page}</>;
    }

    // The read renderer is a lazy (heavy Puck) mount; while its chunk loads the reader keeps seeing the
    // live Inertia page — the fallback is the page, not blank. Only the fork knows the page, so the
    // Suspense lives here (the host's `renderEditor`/`renderInspector` own their own author-chrome fallbacks).
    return (
        <Suspense fallback={<>{payload.page}</>}>
            {payload.entryRef === null ? payload.page : payload.config.renderRead({ body, ref: payload.entryRef })}
        </Suspense>
    );
}

// --- The factory -------------------------------------------------------------------------------

/**
 * Build the Inertia Mainframe host layout from host config. Returns a component that FRAMES the page
 * (`children`) in a Mainframe with the two modes:
 *
 *   - `domain` (read) — the page renders as the `main` payload, bound to its `page` entry.
 *   - `window` (author) — for an author with the `capability` ability, `main` swaps to the kind-aware
 *     editor (Puck canvas for a Puck body, else the in-place inspector).
 *
 * Mode-switch is a child-swap under the stable provider (ADR-0099) — no remount, so the toggle is
 * smooth. The entitlement is fed to the `can` predicate; a non-author never sees the toggle or editor.
 */
export function createMainframeHost(config: MainframeHostConfig) {
    const capability = config.capability ?? 'author-ux';
    const componentToEntry = config.componentToEntry ?? {};
    const componentSlugFallback = config.componentSlugFallback ?? false;
    const ribbon = config.ribbon ?? defaultRibbon;

    return function MainframeHost({ children }: { children: ReactNode }) {
        const { component, canAuthor, slug, entryId } = config.usePageContext();

        // A `beam-page` component carries its entry key as explicit props (its component NAME is
        // `beam-page` — or `site/entry` for a rendered entry — for EVERY such page, so the name→slug map
        // cannot distinguish them). Prefer the props, and prefer the id within them.
        const propSlug = nonEmpty(slug);
        const propId = nonEmpty(entryId);

        // The three branches, in order. Only the first can be an id-only ref; only the props branch can
        // carry BOTH — and it is the branch every migrated page lands on, so the common case addresses
        // by id with the slug still available for display (ADR-0214 §2).
        const entryRef = useMemo<EntryRef | null>(
            () =>
                overrideEntryRef() ??
                (propId !== null || propSlug !== null ? { id: propId, slug: propSlug } : null) ??
                componentEntryRef(component, componentToEntry, componentSlugFallback),
            [component, propSlug, propId],
        );
        const [entry, setEntry] = useState<HostEntryBody | null>(null);
        const [mode, setMode] = useState<'domain' | 'window'>('domain');

        // `entryRef === null` is a real, common answer — a page bound to no entry — and it must NOT
        // reach the transport. Probing anyway is what made every rendered entry ask for a `site-entry`
        // row that has never existed.
        const refKey = entryRef === null ? null : `${entryRef.id ?? ''}\u0000${entryRef.slug ?? ''}`;

        useEffect(() => {
            if (entryRef === null) {
                setEntry(null);

                return;
            }

            let live = true;
            void config.loadEntryBody(entryRef).then((e) => live && setEntry(e));

            return () => {
                live = false;
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps -- refKey IS entryRef, flattened to a
            // primitive so a fresh object identity per render does not re-fetch on every render.
        }, [refKey]);

        // External authoring control (e.g. a Frame OS operator dock): custom window events drive the
        // mode, so authoring needs NO on-page ribbon button. Only an author may enter window mode.
        useEffect(() => {
            const enter = () => {
                if (canAuthor) {
                    setMode('window');
                }
            };
            const exit = () => setMode('domain');
            window.addEventListener('beam-ux:edit', enter);
            window.addEventListener('beam-ux:exit', exit);

            return () => {
                window.removeEventListener('beam-ux:edit', enter);
                window.removeEventListener('beam-ux:exit', exit);
            };
        }, [canAuthor]);

        // Broadcast mode + editability + the current entry slug so an external control (the operator
        // dock) can label its Edit affordance, know whether the current page is editable, and open the
        // page-properties surface for the right slug.
        useEffect(() => {
            window.dispatchEvent(
                new CustomEvent('beam-ux:mode', {
                    // `slug` is kept for the operator docks that already read it (they label their Edit
                    // affordance and open page-properties with it); `entryId` is ADDITIVE beside it. A
                    // CustomEvent detail is untyped, so a rename here would be invisible to every
                    // consumer — the one place in this migration where additive is the safe move.
                    detail: {
                        mode,
                        editable: canAuthor && entry !== null,
                        slug: entryRef?.slug ?? null,
                        entryId: entryRef?.id ?? entry?.id ?? null,
                    },
                }),
            );
            // eslint-disable-next-line react-hooks/exhaustive-deps -- refKey IS entryRef (see above).
        }, [mode, canAuthor, entry, refKey]);

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
                    //   - Puck body            → the Puck composed-page editor (per-node opacity overlay
                    //                             inside it seals any registered island, ADR-0016).
                    //   - chrome-only body     → the real page in place + the RegionInspector over it.
                    //   - no editable body     → fall through to the page, never a blank editor.
                    // `readMode: 'page'` — in READ mode only, the page renders itself unchanged (its own
                    // SiteLayout chrome + full class hierarchy intact) rather than being swapped for the
                    // bare entry body. This must NOT also short-circuit AUTHORING mode (`p.authoring`) —
                    // doing so unconditionally (as this did before) skips every branch below and makes
                    // "Edit this page" a no-op on every readMode:'page' host page that doesn't itself
                    // independently re-implement the mode-broadcast swap (only pages embedding
                    // `PageEditor` did). Falling through instead lands every authoring readMode:'page'
                    // page on the SAME `entryBound` branch below (the entries.body.show envelope always
                    // succeeds, even for an unattached page — `entryBound` is effectively always true) —
                    // the real page in place + the generic, slug-only `renderInspector` overlaid, with
                    // zero per-page integration required.
                    if (p.config.readMode === 'page' && !p.authoring) {
                        return <>{p.page}</>;
                    }

                    if (p.authoring) {
                        // Structural editing opens for any Puck body. The retired `composable` flag was a
                        // coarse whole-entry seal (ticket-14 F06); ADR-0016's per-node opacity overlay
                        // (`isIsland()`, @splicewire/beam-ux/canvas) now does that sealing INSIDE the
                        // canvas the host's `renderEditor` mounts — a behavior-realm entry with a sealed
                        // root node (e.g. AuthForm) still opens the editor, it's just non-editable there.
                        if (isPuckBody(p.entryBodyRaw)) {
                            return <>{p.entryRef === null ? p.page : p.config.renderEditor({ ref: p.entryRef })}</>;
                        }

                        if (p.entryBound) {
                            return (
                                <>
                                    {p.page}
                                    {p.entryRef !== null && p.config.renderInspector({ ref: p.entryRef })}
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
                    : {
                          slug: entry.slug,
                          id: entry.id,
                          schema: entry.schema,
                          body: (entry.body ?? {}) as Record<string, unknown>,
                      },
            [entry],
        );

        const authoring = mode === 'window' && canAuthor;

        const payload: DomainPayload = {
            page: children,
            entryRef,
            entryBound: entry !== null,
            canAuthor,
            authoring,
            entryBodyRaw: entry?.body ?? null,
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
