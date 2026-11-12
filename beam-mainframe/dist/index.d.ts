import * as react from 'react';
import { ReactNode } from 'react';
import { MainframeProps } from '@schemastud/mainframe';

/**
 * The single kind test shared by the read + author forks: a **Puck Data** body is `{content:[…]}`
 * (an array), distinct from a **chrome-only** page body whose `content` is a string. The `main` fork
 * offers the structural Puck canvas only for a Puck body; a chrome-only body edits in place.
 */
declare function isPuckBody(body: unknown): boolean;
/**
 * The loaded `page` entry as the host projects it (beam-ux `entries.body.show`). `id` is the entry's
 * uuid (the `Route::recordVersions()` addressing key, `/beam-ux/entries/{id}/versions`) — optional
 * since a host's `loadEntryBody` may project a narrower shape; present whenever the underlying
 * `BeamUxEntryBodyData` envelope carries it (it always does).
 */
interface HostEntryBody {
    slug: string;
    id?: string;
    schema: Record<string, unknown> | null;
    body: unknown;
}
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
interface EntryRef {
    /** The entry's uuid — the ADR-0214 §2 addressing key — when the host could supply one, else null. */
    id: string | null;
    /** The domain slug, when known. Null only on an id-only ref (`?beam_entry_id=`). */
    slug: string | null;
    /**
     * The entry's **body language** (`'tsx' | 'mdx' | 'css' | …`, beam-ux's `UxFormat`) when the host
     * could supply one, else null.
     *
     * A ref answers *which row*; this answers *which editor may open it*, and a renderer that does not
     * ask produced the worst defect measured in this journey: the operator dock offered the JsonDoc
     * canvas on the mdx `/docs` entry, and one Save replaced the mdx source with a canvas tree — the
     * disk mirror wrote 0 bytes and the public page went blank for every visitor (G2-BEAM-AUTHOR-ENTRY,
     * 2026-09-11). `EntryBodySaveOp` now refuses that write with a 422; this field is what lets a host
     * not attempt it, and show the author an honest reason instead of a wrong editor.
     *
     * **Null is "unknown", not "any"** — the two branches that cannot carry a format (`?beam_entry=` and
     * the component-name guess) produce null, and a renderer treats it as unknown rather than assuming
     * its own. The format is authoritative on the SERVER (`Codec\AcceptsJsonDoc`); this is the hint that
     * keeps the client from making a request the server will refuse.
     */
    format: string | null;
}
/** Display label for a ref — the slug when there is one, else the id. Never blank for a real ref. */
declare function entryRefLabel(ref: EntryRef | null): string;
/** The `{slug, id, schema, body}` a wrapped page reads via {@link useBeamUxEntry}. `body` is host-typed. */
interface BeamUxEntryContext<TBody = Record<string, unknown>> {
    slug: string;
    id?: string;
    schema: Record<string, unknown> | null;
    body: TBody;
}
/**
 * The one seam a reshelled beam-ux page reads its own chrome through. Returns the loaded `page` entry
 * — `{slug, schema, body}` — or `null` until the host's body load resolves (the page falls back to its
 * own copy meanwhile; the entry is the source of truth, never a hard dep). A host typically re-exports
 * a body-typed alias so its pages read `entry.body.heading` etc. with types.
 */
declare function useBeamUxEntry<TBody = Record<string, unknown>>(): BeamUxEntryContext<TBody> | null;
/**
 * The props the host's ribbon render-prop receives — the status/toolbar chrome is host-owned. The
 * ribbon renders only for an author (a reader never sees it), so no `canAuthor` is threaded through.
 */
interface RibbonProps {
    mode: 'domain' | 'window';
    /** The addressed entry, or null when this page is bound to none. See {@link entryRefLabel}. */
    entryRef: EntryRef | null;
    entryBound: boolean;
    onEdit: () => void;
    onExit: () => void;
}
type RibbonRender = (props: RibbonProps) => ReactNode;
/** The page context a host reads off Inertia (`usePage`) — kept behind a function so inertia stays out. */
interface HostPageContext {
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
    /**
     * The entry's **format** off the page's props (`props.entry.format`, emitted by
     * `PublicEntryController` and by a host's own entry-ref support class). Optional and additive for
     * the same reason `entryId` is: a host that does not supply it keeps working, and its renderers see
     * `ref.format === null` (unknown) rather than a wrong answer. See {@link EntryRef.format}.
     */
    entryFormat?: string | null;
}
interface MainframeHostConfig {
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
    /**
     * Whether a NON-author may trigger {@link loadEntryBody}. **Defaults to `false`** — the factory
     * loads an entry body only for a reader the host has already told it may author
     * ({@link HostPageContext.canAuthor}).
     *
     * The default is `false` because the transport behind `loadEntryBody` is the AUTHORING one.
     * `Splicewire\Beam\Ux\Particle\EntryBodyShowOp` declares `ability: 'ux.author'`, and every host
     * on this factory computes the `canAuthor` prop it feeds us as literally
     * `$request->user()?->can('ux.author') ?? false` — the same predicate. So `canAuthor === false`
     * means the load is *guaranteed* to 401; firing it anyway buys nothing and costs an authenticated
     * round-trip plus a permanent console/monitoring 401 on every anonymous view of every public page
     * (beam-docs-satellite ticket 47, measured in a browser at `beam.test/docs` and
     * `satellite.test/docs`).
     *
     * It is a fetch gate, not an authorization gate: the server's gate is unchanged and remains the
     * only thing that decides. Nothing a reader can see changes — `loadEntryBody` already contracts to
     * return `null` on a miss, and `null` is exactly what the 401 produced.
     *
     * Same shape, and the same reasoning, as {@link componentSlugFallback}: unconditional is what
     * produced the defect, so the safe branch is the default and a host that genuinely serves entry
     * bodies to readers (a public read transport, not `EntryBodyShowOp`) opts back in here, in one
     * visible line.
     */
    loadEntryBodyForReaders?: boolean;
    /** The structural Puck editor mount (host-local; carries the heavy author-only deps). */
    renderEditor: (args: {
        ref: EntryRef;
    }) => ReactNode;
    /** The composed read render for a Puck body (host-local). */
    renderRead: (args: {
        body: unknown;
        ref: EntryRef;
    }) => ReactNode;
    /** The in-place RegionInspector overlay for a chrome-only body (host-local). */
    renderInspector: (args: {
        ref: EntryRef;
    }) => ReactNode;
    /** The frame ribbon chrome. Optional — a host with none gets the {@link defaultRibbon} shell. */
    ribbon?: RibbonRender;
    /**
     * Bottom space (px) reserved under `window` (author) mode so a fixed bottom ribbon never clips
     * content. Defaults to 28 (the {@link defaultRibbon} height). A host with a taller ribbon sets its
     * own — the package can't know an injected ribbon's height, so this is the one dimension it exposes.
     */
    ribbonReserve?: number;
}
/**
 * The OOTB frame ribbon a host gets when it injects no `ribbon`. A bottom status bar with the mode +
 * entry + the read↔author toggle. A host with a design system passes its own render-prop to override.
 */
declare const defaultRibbon: RibbonRender;
/**
 * `domain` (read) mode. A reader (guest or any non-author) sees just the page — the ribbon is an
 * authoring-only affordance. Only an author gets the ribbon + the "Edit page" toggle over the page.
 */
declare function DomainMainframe({ slots, ctx }: MainframeProps): react.JSX.Element;
/**
 * `window` (author WYSIWYG) mode — the ribbon FRAMES the in-place surface in `main`: the real page
 * with the RegionInspector docked over it (chrome-only bodies) or the Puck editor (Puck bodies).
 */
declare function WindowMainframe({ slots, ctx }: MainframeProps): react.JSX.Element;
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
declare function createMainframeHost(config: MainframeHostConfig): ({ children }: {
    children: ReactNode;
}) => react.JSX.Element;

/** The authoring modes `createMainframeHost` registers. `window` is the in-place editor. */
type BeamUxMode = 'domain' | 'window';
/** The `beam-ux:mode` detail, as a type. Mirrors the dispatch in host.tsx. */
interface BeamUxModeState {
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
/**
 * Subscribe to the page Mainframe's `beam-ux:mode` broadcast.
 *
 * SSR-safe: the effect never runs on the server, and the initial state is the "know nothing yet"
 * reading rather than an optimistic one.
 */
declare function useBeamUxMode(): BeamUxModeState;
/** Ask the page Mainframe to ENTER the in-place editor. The write side of the same contract. */
declare function requestBeamUxEdit(): void;
/** Ask the page Mainframe to LEAVE the in-place editor. */
declare function requestBeamUxExit(): void;

export { type BeamUxEntryContext, type BeamUxMode, type BeamUxModeState, DomainMainframe, type EntryRef, type HostEntryBody, type HostPageContext, type MainframeHostConfig, type RibbonProps, type RibbonRender, WindowMainframe, createMainframeHost, defaultRibbon, entryRefLabel, isPuckBody, requestBeamUxEdit, requestBeamUxExit, useBeamUxEntry, useBeamUxMode };
